import 'server-only'
import * as Sentry from '@sentry/nextjs'
import { query } from '@/lib/db'
import { exactEnabled } from '@/lib/exact/client'
import { isExactEligible } from '@/lib/exact/map-lead'
import { pushLeadToExact } from '@/lib/exact/push-lead'
import type { FormType } from '@/lib/forms'
import { type CrmProvider, crmProvider } from './provider'
import {
  backoffCrm,
  ESPERA_CONCILIACAO_MS,
  LEASE_CRM_MS,
  MAX_TENTATIVAS_CRM,
  predicadoFila,
} from './queue'
import { RdDuplicadosErro } from './rdstation/client'
import { pushLeadToRd, RdAguardandoConciliacao, RdEsgotadoErro } from './rdstation/push-lead'

type Estado = {
  crm_contact_id: string | null
  crm_post_iniciado_em: Date | null
  crm_deal_id: string | null
  crm_attempts: number
  pode_criar: boolean
  crm_conciliar_em: Date | null
}
type Tentativa = { tentativas: number; contabilizada: boolean }
export type ResultadoCrm = { ok: boolean; error?: string; aguardando?: boolean }

export async function relatarErroCrm(
  erro: unknown,
  leadId?: string,
  level: 'error' | 'warning' = 'error',
): Promise<void> {
  // Somente mensagem interna e ID do site; nunca payload, e-mail ou bearer.
  Sentry.captureException(erro, { level, tags: { integracao: 'crm' }, extra: { leadId } })
  try {
    await Sentry.flush(2_000)
  } catch (err) {
    console.error('[crm] falha ao descarregar evento Sentry', err)
  }
}

async function reservar(leadId: string, provider: CrmProvider): Promise<Estado | undefined> {
  const { rows } = await query<Estado>(
    `with candidato as (
       select id, crm_attempts < $3 as pode_criar from cms.leads
       where id = $1 and ${predicadoFila('$2', '$3')} for update skip locked
     ) update cms.leads l set crm_provider = $2,
       crm_travado_ate = now() + ($5::double precision * interval '1 millisecond'),
       crm_status = case when crm_post_iniciado_em is null then 'enviando' else 'incerto' end
     from candidato where l.id = candidato.id
     returning crm_contact_id, crm_post_iniciado_em, crm_deal_id, crm_attempts, candidato.pode_criar,
       crm_post_iniciado_em + ($4::double precision * interval '1 millisecond') as crm_conciliar_em`,
    [leadId, provider, MAX_TENTATIVAS_CRM, ESPERA_CONCILIACAO_MS, LEASE_CRM_MS],
  )
  return rows[0]
}

async function enviarExact(
  form: FormType,
  data: Record<string, string>,
  id: string,
  tentativa: Tentativa,
) {
  const { rows } = await query(
    `update cms.leads set crm_attempts = crm_attempts + 1
    where id = $1 and crm_attempts < $2 returning id`,
    [id, MAX_TENTATIVAS_CRM],
  )
  if (!rows.length) throw new RdEsgotadoErro()
  tentativa.tentativas++
  tentativa.contabilizada = true
  const push = await pushLeadToExact(form, data)
  if (!push) throw new Error('Exact ativo mas envio não produziu resultado')
  await query(
    `update cms.leads set exact_lead_id = $1, exact_error = $2,
      exact_attempts = exact_attempts + 1 where id = $3`,
    [push.ok ? push.exactLeadId : null, push.ok ? (push.personError ?? null) : push.error, id],
  )
  if (!push.ok) throw new Error(push.error)
  if (push.personError) await relatarErroCrm(new Error(push.personError), id, 'warning')
  return { dealId: String(push.exactLeadId), contactId: null, aviso: push.personError ?? null }
}

async function enviarRd(
  form: FormType,
  data: Record<string, string>,
  id: string,
  estado: Estado,
  tentativa: Tentativa,
) {
  return pushLeadToRd(form, data, id, {
    contactId: estado.crm_contact_id,
    dealId: estado.crm_deal_id,
    postIniciado: Boolean(estado.crm_post_iniciado_em),
    postIniciadoEm: estado.crm_post_iniciado_em,
    conciliarEm: estado.crm_conciliar_em,
    podeCriar: estado.pode_criar,
    antesDoPost: async (contactId) => {
      const { rows } = await query(
        `update cms.leads set crm_contact_id = $1, crm_post_iniciado_em = coalesce(crm_post_iniciado_em, now()), crm_status = 'incerto',
         crm_reconciliar_em = now() + ($3::double precision * interval '1 millisecond'),
         crm_attempts = crm_attempts + 1
         where id = $2 and crm_provider = 'rdstation' and crm_attempts < $4 returning id`,
        [contactId, id, ESPERA_CONCILIACAO_MS, MAX_TENTATIVAS_CRM],
      )
      if (!rows.length) throw new RdEsgotadoErro()
      tentativa.tentativas++
      tentativa.contabilizada = true
    },
    rejeitado: async () => {
      await query(
        `update cms.leads set crm_post_iniciado_em = null, crm_reconciliar_em = null
         where id = $1 and crm_provider = 'rdstation'`,
        [id],
      )
    },
  })
}

async function concluir(
  id: string,
  provider: CrmProvider,
  resultado: {
    dealId: string
    contactId: string | null
    aviso?: string | null
    recriado?: boolean
  },
): Promise<void> {
  await query(
    `update cms.leads set crm_deal_id = $1, crm_contact_id = $2, crm_error = $3,
     crm_enviado_em = coalesce(crm_enviado_em, now()), crm_status = 'enviado', crm_travado_ate = null, crm_proxima_tentativa_em = now(),
     crm_reconciliar_em = case when $6 then now() + ($7::double precision * interval '1 millisecond') else null end
     where id = $4 and crm_provider = $5`,
    [
      resultado.dealId,
      resultado.contactId,
      resultado.aviso ?? null,
      id,
      provider,
      resultado.recriado ?? false,
      ESPERA_CONCILIACAO_MS,
    ],
  )
}

/** O chamador da action ignora o resultado; cron transforma ok:false em não-2xx. */
export async function enviarLeadAoCrm(
  form: FormType,
  data: Record<string, string>,
  leadId: string,
): Promise<ResultadoCrm | null> {
  if (!isExactEligible(form, data)) return null
  let tentativa: Tentativa | undefined
  try {
    const provider = crmProvider()
    if (provider === 'exact' && !exactEnabled()) return null
    const estado = await reservar(leadId, provider)
    if (!estado) return null
    tentativa = { tentativas: estado.crm_attempts, contabilizada: false }
    const resultado =
      provider === 'exact'
        ? await enviarExact(form, data, leadId, tentativa)
        : await enviarRd(form, data, leadId, estado, tentativa)
    await concluir(leadId, provider, resultado)
    if ('recriado' in resultado && resultado.recriado) {
      await relatarErroCrm(
        new Error('RD Station: recriado após incerteza; conferir duplicado'),
        leadId,
        'warning',
      )
    }
    return { ok: true }
  } catch (err) {
    if (err instanceof RdAguardandoConciliacao) {
      return aguardarConciliacao(leadId, err.tentarEm)
    }
    if (err instanceof RdDuplicadosErro) return registrarTerminal(leadId, err, 'duplicado')
    if (err instanceof RdEsgotadoErro) return registrarTerminal(leadId, err, 'esgotado')
    return registrarFalha(leadId, erroEstruturaCrm(err), tentativa)
  }
}

async function aguardarConciliacao(leadId: string, tentarEm: Date): Promise<ResultadoCrm> {
  try {
    await query(
      `update cms.leads set crm_travado_ate = null, crm_proxima_tentativa_em = $1,
       crm_status = 'incerto' where id = $2`,
      [tentarEm, leadId],
    )
    return { ok: true, aguardando: true }
  } catch (err) {
    return registrarFalha(leadId, erroEstruturaCrm(err))
  }
}

async function registrarFalha(
  leadId: string,
  err: unknown,
  tentativa?: Tentativa,
): Promise<ResultadoCrm> {
  const incrementar = tentativa && !tentativa.contabilizada ? 1 : 0
  const tentativas = Math.min(MAX_TENTATIVAS_CRM, (tentativa?.tentativas ?? 0) + incrementar)
  const error = err instanceof Error ? err.message : 'Falha desconhecida no CRM'
  await relatarErroCrm(new Error(error), leadId)
  try {
    await query(
      `update cms.leads set crm_error = $1, crm_travado_ate = null,
       crm_status = case when crm_post_iniciado_em is null then 'erro' else 'incerto' end,
       crm_attempts = least(crm_attempts + $4, $5),
       crm_proxima_tentativa_em = now() + ($3::double precision * interval '1 millisecond')
       where id = $2`,
      [error, leadId, backoffCrm(tentativas), incrementar, MAX_TENTATIVAS_CRM],
    )
  } catch (dbErr) {
    await relatarErroCrm(new Error('CRM: falha ao registrar resultado no banco'), leadId)
    console.error('[crm] falha ao registrar erro', dbErr)
  }
  return { ok: false, error }
}

/** Transição atômica: só quem gravou o estado terminal emite o alerta. */
async function registrarTerminal(
  leadId: string,
  err: Error,
  status: 'duplicado' | 'esgotado',
): Promise<ResultadoCrm> {
  try {
    const { rows } = await query(
      `update cms.leads set crm_status = $3, crm_error = $1,
      crm_travado_ate = null, crm_reconciliar_em = null
      where id = $2 and crm_status not in ('duplicado', 'esgotado') returning id`,
      [err.message, leadId, status],
    )
    if (rows.length) await relatarErroCrm(err, leadId)
    return { ok: false, error: err.message }
  } catch (dbErr) {
    return registrarFalha(leadId, erroEstruturaCrm(dbErr))
  }
}

/** Falta de migração é uma falha operacional explícita, inclusive no cron. */
export function erroEstruturaCrm(err: unknown): unknown {
  if (
    err &&
    typeof err === 'object' &&
    'code' in err &&
    ['42703', '42883'].includes(String(err.code))
  ) {
    return new Error(
      'CRM: estrutura ausente; aplicar db/2026-11-04-crm-provider-1-cms-user.sql ANTES do deploy',
    )
  }
  return err
}
