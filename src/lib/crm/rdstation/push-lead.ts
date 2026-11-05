import 'server-only'
import { z } from 'zod'
import { deveRecriar, ESPERA_CONCILIACAO_MS, MAX_TENTATIVAS_CRM } from '@/lib/crm/queue'
import type { FormType } from '@/lib/forms'
import { buscarRd, criarRd, literalRd, rejeicaoDefinitiva, requisitarRd } from './client'
import { obterConfigRd } from './load-config'
import { contatoRd, negocioRd } from './map-lead'
import { resolverCamposRd } from './resolve-fields'
import { obterTokenRd } from './token'

export type EstadoRd = {
  contactId: string | null
  dealId?: string | null
  podeCriar?: boolean
  postIniciado: boolean
  postIniciadoEm?: Date | null
  conciliarEm?: Date | null
  antesDoPost: (contactId: string) => Promise<void>
  rejeitado: () => Promise<void>
}

export class RdAguardandoConciliacao extends Error {
  constructor(readonly tentarEm: Date) {
    super('RD Station: aguardando conciliação')
  }
}

export class RdEsgotadoErro extends Error {
  constructor() {
    super(`RD Station: teto de ${MAX_TENTATIVAS_CRM} tentativas atingido; conciliação sem card`)
  }
}

async function obterContato(token: string, contato: ReturnType<typeof contatoRd>) {
  const email = contato.emails[0]?.email
  if (email) {
    const encontrado = await buscarRd(token, 'contacts', `email:${literalRd(email)}`)
    if (encontrado) return encontrado.id
  }
  const phone = contato.phones[0]?.phone
  if (phone) {
    const encontrado = await buscarRd(token, 'contacts', `phone:${literalRd(phone)}`)
    if (encontrado) return encontrado.id
  }
  return (await criarRd(token, 'contacts', contato)).id
}

export async function pushLeadToRd(
  form: FormType,
  data: Record<string, string>,
  leadId: string,
  estado: EstadoRd,
): Promise<{ dealId: string; contactId: string | null; recriado?: boolean }> {
  const configuracao = await obterConfigRd()
  const token = await obterTokenRd()
  const config = await resolverCamposRd(token, configuracao)
  const existente = await buscarRd(
    token,
    'deals',
    `@${config.campos.id_lead_site}:${literalRd(leadId)}`,
  )
  if (existente) {
    return { dealId: existente.id, contactId: existente.contact_ids?.[0] ?? estado.contactId }
  }
  const recriado = estado.postIniciado && deveRecriar(estado.postIniciadoEm)
  if (estado.postIniciado && !recriado) {
    throw new RdAguardandoConciliacao(
      estado.conciliarEm ??
        new Date(new Date(estado.postIniciadoEm ?? Date.now()).getTime() + ESPERA_CONCILIACAO_MS),
    )
  }
  if (estado.podeCriar === false) throw new RdEsgotadoErro()
  if (estado.dealId) throw new Error('RD Station: card confirmado não apareceu na reconciliação')
  const negocio = negocioRd(form, data, leadId, config)
  // A API escolhe o funil pela etapa. Confere a associação antes de criar contato/card.
  await validarEtapa(token, config.pipelineId, config.stageId)
  const contactId = estado.contactId ?? (await obterContato(token, contatoRd(data)))
  // Persistir ANTES do POST cobre também término abrupto da função na Vercel.
  await estado.antesDoPost(contactId)
  try {
    const criado = await criarRd(token, 'deals', { ...negocio, contact_ids: [contactId] })
    return { dealId: criado.id, contactId, ...(recriado ? { recriado: true } : {}) }
  } catch (err) {
    // Rejeição da nova requisição não desfaz a incerteza da requisição anterior.
    if (rejeicaoDefinitiva(err) && !estado.postIniciado) await estado.rejeitado()
    throw err
  }
}

async function validarEtapa(token: string, pipelineId: string, stageId: string): Promise<void> {
  const etapa = z
    .object({ data: z.object({ id: z.string() }) })
    .parse(await requisitarRd(token, `pipelines/${pipelineId}/stages/${stageId}`))
  if (etapa.data.id !== stageId) {
    throw new Error('RD Station: etapa configurada não pertence ao funil')
  }
}
