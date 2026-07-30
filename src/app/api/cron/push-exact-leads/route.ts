import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { pushLeadToExact } from '@/lib/exact/push-lead'
import type { FormType } from '@/lib/forms'

/**
 * Cron (Vercel) — rede de segurança do push pro Exact. O caminho normal é
 * síncrono, na Server Action do formulário; aqui só passam os leads em que
 * aquele push falhou (CRM fora do ar, timeout, payload recusado) ou que foram
 * gravados antes de a integração estar ligada.
 *
 * Janela de 48 h e teto de 5 tentativas: um payload que o Exact recusa por
 * regra (e não por indisponibilidade) não fica sendo reenviado pra sempre — o
 * motivo continua legível em `exact_error`, e o lead nunca se perde, porque
 * está em `cms.leads` e já gerou e-mail pra equipe no momento do envio.
 *
 * Roda **de hora em hora** (`vercel.json`, minuto 15) — a conta é Pro, que não
 * tem o limite de 1×/dia do Hobby. Importa porque o lead vale mais quente:
 * esperar até o dia seguinte pra reenviar um lead que caiu num timeout é perder
 * o dia de contato.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const WINDOW_HOURS = 48
const MAX_ATTEMPTS = 5

type PendingRow = { id: string; form: FormType; data: Record<string, string> }

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const cutoff = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString()

    // Mesma regra de elegibilidade de `isExactEligible`, aplicada em SQL pra
    // não trazer do banco o que nunca seria enviado (atendimento a cliente).
    const { rows: pendentes } = await query<PendingRow>(
      `select id, form, data from cms.leads
        where exact_lead_id is null
          and created_at > $1
          and exact_attempts < $2
          and (form = 'proposta' or (form = 'contato' and data->>'assunto' = 'proposta-comercial'))
        order by created_at asc`,
      [cutoff, MAX_ATTEMPTS],
    )

    let enviados = 0
    let falhas = 0

    // Sequencial de propósito: o volume é de poucos leads por dia e o Exact
    // limita a 30 requisições a cada 20 s.
    for (const lead of pendentes) {
      const push = await pushLeadToExact(lead.form, lead.data)
      if (!push) continue
      if (push.ok) enviados += 1
      else falhas += 1

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

    return NextResponse.json({
      ok: falhas === 0,
      considerados: pendentes.length,
      enviados,
      falhas,
    })
  } catch (err) {
    console.error('[cron/push-exact-leads] erro:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
