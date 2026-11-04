import 'server-only'

import * as Sentry from '@sentry/nextjs'
import { after } from 'next/server'
import { query } from '@/lib/db'
import { converterNoMarketing } from './client'
import type { ConversaoMarketing } from './payload'

type ReservaMarketing = {
  id: string
  rd_marketing_payload: ConversaoMarketing
  rd_marketing_attempts: number
}

// Mesmo predicado no SELECT e no UPDATE: inclusive a recuperação de worker encerrado.
export const FILA_MARKETING = `rd_marketing_payload is not null
  and rd_marketing_status in ('pendente', 'incerto', 'enviando')
  and rd_marketing_attempts < 2
  and rd_marketing_proxima_tentativa_em <= now()
  and (form = 'proposta' or (form = 'contato' and data->>'assunto' = 'proposta-comercial'))
  and data->>'duplicaDe' is null`

function credencial(): string | undefined {
  const key = process.env.RD_MARKETING_API_KEY?.trim()
  if (!key) console.info('[rd-marketing] RD_MARKETING_API_KEY ausente; envio desativado.')
  return key || undefined
}

async function avisar(codigo: string, leadId?: string): Promise<void> {
  try {
    Sentry.captureMessage('Falha na conversão RD Marketing', {
      level: 'warning',
      tags: { fluxo: 'rd_marketing', codigo, lead_id: leadId ?? 'cron' },
    })
    await Sentry.flush(1000)
  } catch {
    console.warn('[rd-marketing] falha ao registrar warning no Sentry.')
  }
}

/** Reserva antes do HTTP; duas chamadas concorrentes não geram dois POSTs. */
export async function enviarConversaoMarketing(id: string): Promise<void> {
  const key = credencial()
  if (!key) return
  try {
    const { rows } = await query<ReservaMarketing>(
      `update cms.leads set rd_marketing_status = 'enviando',
         rd_marketing_attempts = rd_marketing_attempts + 1,
         rd_marketing_proxima_tentativa_em = now() + interval '30 minutes'
       where id = $1 and ${FILA_MARKETING}
       returning id, rd_marketing_payload, rd_marketing_attempts`,
      [id],
    )
    if (rows[0]) await enviarReserva(key, rows[0])
  } catch {
    await avisar('persistencia', id)
  }
}

async function enviarReserva(key: string, reserva: ReservaMarketing): Promise<void> {
  const resultado = await converterNoMarketing(key, reserva.rd_marketing_payload)
  const status =
    resultado.status === 'incerto' && reserva.rd_marketing_attempts >= 2
      ? 'esgotado'
      : resultado.status
  await query(
    `update cms.leads set rd_marketing_status = $2, rd_marketing_event_uuid = $3,
       rd_marketing_error = $4,
       rd_marketing_enviado_em = case when $2 = 'enviado' then now() else null end
     where id = $1 and rd_marketing_attempts = $5 and rd_marketing_status = 'enviando'`,
    [
      reserva.id,
      status,
      resultado.status === 'enviado' ? resultado.eventUuid : null,
      resultado.status === 'enviado' ? null : resultado.codigo,
      reserva.rd_marketing_attempts,
    ],
  )
  if (resultado.status !== 'enviado') await avisar(resultado.codigo, reserva.id)
}

/** Falha na fila nunca interfere no cron do CRM; não lê banco sem credencial. */
export async function retentarConversoesMarketing(): Promise<void> {
  if (!credencial()) return
  try {
    const { rows: esgotados } = await query<{ id: string }>(
      `update cms.leads set rd_marketing_status = 'esgotado',
         rd_marketing_error = 'worker_encerrado_sem_confirmacao'
       where rd_marketing_status = 'enviando' and rd_marketing_attempts >= 2
         and rd_marketing_proxima_tentativa_em <= now() returning id`,
    )
    for (const lead of esgotados) await avisar('worker_encerrado_sem_confirmacao', lead.id)
    const { rows } = await query<{ id: string }>(
      `select id from cms.leads where ${FILA_MARKETING}
       order by rd_marketing_proxima_tentativa_em, id limit 3`,
    )
    for (const lead of rows) await enviarConversaoMarketing(lead.id)
  } catch {
    await avisar('ler_fila')
  }
}

/** Registro isolado para o merge com a frente CRM; até o agendamento é best-effort. */
export function agendarConversaoMarketing(id?: string): void {
  if (!id || !credencial()) return
  try {
    after(() => enviarConversaoMarketing(id))
  } catch {
    console.warn('[rd-marketing] after indisponível; lead aguarda o cron.')
  }
}

export function agendarRetryMarketing(): void {
  if (!credencial()) return
  try {
    after(() => retentarConversoesMarketing())
  } catch {
    console.warn('[rd-marketing] after do cron indisponível; aguarda próxima execução.')
  }
}
