import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { pushLeadToExact } from '@/lib/exact/push-lead'
import { SQL_REIVINDICAR_ETAPA1, SQL_REIVINDICAR_REENVIO_EXACT } from '@/lib/leads/criterios'
import { dadosParaOExact, type LinhaDoLead } from '@/lib/leads/linha'
import { processarPosGravacao } from '@/lib/leads/posGravacao'
import { reportarFalhaDoLead } from '@/lib/leads/reportar'

/**
 * Cron (Vercel), **a cada 15 minutos** (`vercel.json`; a conta é Pro, sem o limite de 1×/dia do
 * Hobby). Duas fases:
 *
 * (A) **Etapa 1 sem etapa 2 há 45 min** (formulário de duas etapas, spec 4.3): reivindica a linha
 * no banco e manda Exact + e-mail interno + Ads uma vez, pela mesma pós-gravação da action. Com
 * a frequência de 15 min, a espera real fica entre 45 e 60 min.
 *
 * (B) **Rede de segurança do Exact:** o que falhou na hora (CRM fora do ar, timeout, payload
 * recusado) é reenviado por 48 h, até 5 tentativas, com trava contra duas execuções simultâneas.
 * Linha com `etapa` nula (formulário antigo, contato "proposta comercial") vale como completa.
 *
 * Só linhas de produção ou antigas (`data.ambiente`): Preview e local gravam no mesmo banco.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const WINDOW_HOURS = 48
const MAX_ATTEMPTS = 5
const LOTE_ETAPA1 = 10
const LOTE_REENVIO = 20

type Reenvio = Pick<LinhaDoLead, 'id' | 'form' | 'etapa' | 'data'>

async function enviarEtapas1Vencidas(
  corte: string,
): Promise<{ reivindicadas: number; falhas: number }> {
  const { rows } = await query<LinhaDoLead>(SQL_REIVINDICAR_ETAPA1, [corte, LOTE_ETAPA1])
  let falhas = 0
  // Sequencial: poucos leads por hora, e o Exact limita a 30 requisições a cada 20 s.
  for (const linha of rows) {
    const resumo = await processarPosGravacao(linha, 'cron')
    if (resumo.exact === 'falhou') falhas += 1
  }
  return { reivindicadas: rows.length, falhas }
}

async function reenviarAoExact(
  corte: string,
): Promise<{ considerados: number; enviados: number; falhas: number }> {
  const { rows } = await query<Reenvio>(SQL_REIVINDICAR_REENVIO_EXACT, [
    corte,
    MAX_ATTEMPTS,
    LOTE_REENVIO,
  ])
  let enviados = 0
  let falhas = 0
  for (const lead of rows) {
    const push = await pushLeadToExact(lead.form, dadosParaOExact(lead))
    if (!push) continue
    if (push.ok) enviados += 1
    else {
      falhas += 1
      // O motivo do Exact pode ecoar telefone ou e-mail: fica em `exact_error`, não no Sentry.
      reportarFalhaDoLead(
        'exact',
        new Error('Exact recusou ou não respondeu (detalhe em exact_error)'),
        { origem: 'cron-exact', leadId: lead.id },
      )
    }
    await query(
      `update cms.leads
          set exact_lead_id = $1, exact_error = $2, exact_attempts = exact_attempts + 1
        where id = $3`,
      [
        push.ok ? push.exactLeadId : null,
        push.ok ? (push.personError ?? null) : push.error,
        lead.id,
      ],
    )
  }
  return { considerados: rows.length, enviados, falhas }
}

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const corte = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString()
    const etapa1 = await enviarEtapas1Vencidas(corte)
    const reenvio = await reenviarAoExact(corte)
    return NextResponse.json({
      ok: etapa1.falhas === 0 && reenvio.falhas === 0,
      etapa1,
      ...reenvio,
    })
  } catch (err) {
    reportarFalhaDoLead('cron', err, { origem: 'cron-exact' })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
