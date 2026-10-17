import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { pushLeadToExact } from '@/lib/exact/push-lead'
import { SQL_REIVINDICAR_ETAPA1, SQL_REIVINDICAR_REENVIO_EXACT } from '@/lib/leads/criterios'
import { dadosParaOExact, type LinhaDoLead } from '@/lib/leads/linha'
import { processarPosGravacao } from '@/lib/leads/posGravacao'
import { descreverErro, reportarFalhaDoLead } from '@/lib/leads/reportar'

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
 * **Orçamento de tempo:** a fase A reivindica uma linha por vez e não reivindica outra depois de
 * 30 s; a B não começa item depois de 45 s. O que sobra fica para a próxima execução. É o que
 * impede a Vercel de matar a função com uma linha já reivindicada e sem e-mail enviado (ninguém a
 * reenviaria). Pior caso de uma linha da fase A: Exact 2 × 8 s, SendGrid 2 × 5 s, Google 2 × 5 s,
 * uns 37 s; começando aos 30 s, termina perto dos 67 s, daí o `maxDuration` de 90.
 *
 * Só linhas de produção ou antigas (`data.ambiente`): Preview e local gravam no mesmo banco.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 90

const WINDOW_HOURS = 48
const MAX_ATTEMPTS = 5
const LOTE_REENVIO = 20
const ORCAMENTO_ETAPA1_MS = 30_000
const ORCAMENTO_REENVIO_MS = 45_000
/** Etapa 1 reivindicada com mais que isso indica cron parado (o normal é 45 a 60 min). */
const ATRASO_DO_CRON_MS = 2 * 60 * 60 * 1000

type Reenvio = Pick<LinhaDoLead, 'id' | 'form' | 'etapa' | 'data'>

/** Uma reivindicação por vez: nada fica reivindicado sem ser processado se a execução estourar. */
async function enviarEtapas1Vencidas(
  inicio: number,
): Promise<{ reivindicadas: number; falhas: number }> {
  let reivindicadas = 0
  let falhas = 0
  // Sequencial: poucos leads por hora, e o Exact limita a 30 requisições a cada 20 s.
  while (Date.now() - inicio < ORCAMENTO_ETAPA1_MS) {
    const { rows } = await query<LinhaDoLead>(SQL_REIVINDICAR_ETAPA1)
    const linha = rows[0]
    if (!linha) break
    reivindicadas += 1
    avisarSeAtrasada(linha)
    const resumo = await processarPosGravacao(linha, 'cron')
    if (resumo.exact === 'falhou') falhas += 1
  }
  return { reivindicadas, falhas }
}

function avisarSeAtrasada(linha: LinhaDoLead): void {
  const idadeMs = Date.now() - new Date(linha.created_at).getTime()
  if (idadeMs <= ATRASO_DO_CRON_MS) return
  reportarFalhaDoLead('cron_atrasado', new Error('Etapa 1 reivindicada com mais de 2 h'), {
    origem: 'cron-exact',
    leadId: linha.id,
    idadeMin: Math.round(idadeMs / 60_000),
  })
}

async function reenviarAoExact(
  inicio: number,
  corte: string,
): Promise<{ considerados: number; enviados: number; falhas: number }> {
  if (Date.now() - inicio >= ORCAMENTO_REENVIO_MS)
    return { considerados: 0, enviados: 0, falhas: 0 }
  const { rows } = await query<Reenvio>(SQL_REIVINDICAR_REENVIO_EXACT, [
    corte,
    MAX_ATTEMPTS,
    LOTE_REENVIO,
  ])
  let enviados = 0
  let falhas = 0
  for (const lead of rows) {
    // O que não couber fica com a trava de 10 min e volta numa próxima execução (sem perda).
    if (Date.now() - inicio >= ORCAMENTO_REENVIO_MS) break
    const resultado = await reenviarUm(lead)
    if (resultado === 'enviado') enviados += 1
    if (resultado === 'falhou') falhas += 1
  }
  return { considerados: rows.length, enviados, falhas }
}

async function reenviarUm(lead: Reenvio): Promise<'enviado' | 'falhou' | 'nao_enviado'> {
  const push = await pushLeadToExact(lead.form, dadosParaOExact(lead))
  if (!push) return 'nao_enviado'
  if (!push.ok) {
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
    [push.ok ? push.exactLeadId : null, push.ok ? (push.personError ?? null) : push.error, lead.id],
  )
  return push.ok ? 'enviado' : 'falhou'
}

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const inicio = Date.now()
    const corte = new Date(inicio - WINDOW_HOURS * 60 * 60 * 1000).toISOString()
    const etapa1 = await enviarEtapas1Vencidas(inicio)
    const reenvio = await reenviarAoExact(inicio, corte)
    return NextResponse.json({
      ok: etapa1.falhas === 0 && reenvio.falhas === 0,
      etapa1,
      ...reenvio,
    })
  } catch (err) {
    reportarFalhaDoLead('cron', err, { origem: 'cron-exact' })
    // Só a classe do erro: o texto do Postgres pode ecoar dado pessoal.
    return NextResponse.json({ error: descreverErro(err) }, { status: 500 })
  }
}
