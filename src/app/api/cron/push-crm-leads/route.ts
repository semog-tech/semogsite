import { NextResponse } from 'next/server'
import { crmProvider } from '@/lib/crm/provider'
import {
  type EstadoFila,
  LOTE_CRM,
  MAX_TENTATIVAS_CRM,
  podeProcessarFila,
  predicadoFila,
} from '@/lib/crm/queue'
import { enviarLeadAoCrm, erroEstruturaCrm, relatarErroCrm } from '@/lib/crm/send-lead'
import { query } from '@/lib/db'
import { DUPLICA_DE_FIELD, type FormType } from '@/lib/forms'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

type Pendente = EstadoFila & { id: string; form: FormType; data: Record<string, string> }

/** Retry horário; cada execução processa até 25 propostas, respeitando provedor e lease. */
export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    const provider = crmProvider()
    const { rows } = await query<Pendente>(
      `select id, form, data, crm_provider, crm_status, crm_deal_id, exact_lead_id, crm_attempts,
         exact_attempts, created_at, crm_travado_ate, crm_reconciliar_em, crm_proxima_tentativa_em
       from cms.leads where ${predicadoFila('$1', '$2')}
         and (form = 'proposta' or (form = 'contato' and data->>'assunto' = 'proposta-comercial'))
         and data->>'${DUPLICA_DE_FIELD}' is null
       order by crm_proxima_tentativa_em asc, id asc limit ${LOTE_CRM}`,
      [provider, MAX_TENTATIVAS_CRM],
    )
    return await processar(rows.filter((lead) => podeProcessarFila(lead, provider)))
  } catch (err) {
    await relatarErroCrm(erroEstruturaCrm(err))
    return NextResponse.json(
      {
        error:
          erroEstruturaCrm(err) instanceof Error
            ? String(erroEstruturaCrm(err))
            : 'Falha no cron do CRM',
      },
      { status: 500 },
    )
  }
}

async function processar(pendentes: Pendente[]): Promise<Response> {
  let enviados = 0
  let falhas = 0
  const inicio = Date.now()
  for (const lead of pendentes) {
    if (Date.now() - inicio > 180_000) break
    const resultado = await enviarLeadAoCrm(lead.form, lead.data, lead.id)
    if (resultado?.aguardando) continue
    if (resultado?.ok) enviados++
    else if (resultado) falhas++
  }
  return NextResponse.json(
    { ok: falhas === 0, considerados: pendentes.length, enviados, falhas },
    {
      status: falhas ? 502 : 200,
    },
  )
}
