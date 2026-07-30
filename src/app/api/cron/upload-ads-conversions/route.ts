import { JWT } from 'google-auth-library'
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

/**
 * Cron (Vercel) — sobe conversões pro Google Ads pelo SERVIDOR, à prova de
 * ad-blocker. O `AttributionTracker` grava o `gclid` num cookie de 1ª parte
 * (não bloqueável) e daí saem os dois sinais que hoje valem conversão:
 *
 * - **Formulário** (`cms.leads`) → ação `Proposta (servidor) - gclid`.
 * - **Clique no WhatsApp** (`cms.whatsapp_clicks`, via `/api/track/whatsapp`)
 *   → ação `WhatsApp (servidor) - gclid`.
 *
 * O WhatsApp entrou porque é o canal dominante e estava invisível: medido em
 * 29/07/2026 no GA4 (janela 24-29/07, tracking limpo), 14 `whatsapp_click`
 * contra 5 `generate_lead` — e no tráfego pago, 7 contra 1. O Ads enxergava só
 * o formulário, então a campanha aparentava 1 resultado tendo gerado ~8
 * contatos, e o Smart Bidding otimizaria por um sinal raro.
 *
 * Envio pela **Data Manager API** (`events:ingest`) — o método novo do Google
 * (o antigo `UploadClickConversions` foi restrito a contas legadas). Uma
 * chamada por ação de conversão, porque `productDestinationId` é por destino.
 *
 * Auth: service account + domain-wide delegation com o escopo
 * `https://www.googleapis.com/auth/datamanager` (precisa estar autorizado no
 * Admin do Workspace pro client-id da SA). `CRON_SECRET` (Bearer). Roda
 * 1×/dia (vercel.json).
 *
 * Idempotência: o backstop de verdade contra conversão duplicada é o
 * `transactionId` (estável entre retries — `lead-<id>` / `wa-<id>`, prefixados
 * pra que um lead e um clique de WhatsApp com o mesmo id numérico nunca
 * colidam) que vai em cada evento pra Data Manager API — o Google dedupe por
 * esse campo, então mesmo que a mesma linha seja enviada 2x (ex.: corrida
 * entre execuções do cron), o Ads não conta a conversão duas vezes. A coluna
 * `uploaded_to_ads` é só a otimização que evita reenviar o que já foi
 * confirmado, reduzindo volume de chamadas — não é a única linha de defesa. A
 * janela de `WINDOW_DAYS` continua como cinto-e-suspensório (evita reprocessar
 * todo o histórico se a flag um dia for resetada por engano). O UPDATE que
 * marca as linhas só roda **depois** da resposta do Google vir OK, e é um
 * único `update ... where id = any($1)` (todos os ids do lote de uma vez, não
 * um loop de UPDATEs sequenciais) — assim a marcação é tudo-ou-nada no banco:
 * não há como o processo morrer no meio de N updates individuais e deixar
 * linhas já enviadas mas ainda `uploaded_to_ads = false`. Se o upload falhar
 * (ou o cron cair antes do UPDATE), nada é marcado e tudo é retentado no
 * próximo dia; nunca marcamos antes de confirmar, pra nunca perder uma
 * conversão silenciosamente.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const INGEST_URL = 'https://datamanager.googleapis.com/v1/events:ingest'
const SCOPE = 'https://www.googleapis.com/auth/datamanager'
const WINDOW_DAYS = 3

/** Bigint (`id`) volta do `pg` como string — sem type parser custom. */
type PendingRow = {
  id: string
  created_at: string | Date
  gclid: string
}

type BatchResult = {
  considered: number
  ok: boolean
  status?: number
  response?: string
  skipped?: string
}

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const {
    GOOGLE_ADS_LOGIN_CUSTOMER_ID: LOGIN,
    GOOGLE_ADS_CUSTOMER_ID: CUSTOMER,
    GOOGLE_ADS_CONVERSION_ACTION_ID: CONV_ACTION,
    GOOGLE_ADS_WHATSAPP_CONVERSION_ACTION_ID: WA_ACTION,
    GOOGLE_ADS_IMPERSONATED_EMAIL: SUBJECT,
    GOOGLE_SA_JSON,
  } = process.env

  // `WA_ACTION` é opcional de propósito: o código do WhatsApp pode subir antes
  // da ação de conversão existir no Ads. Sem ela, essa metade é pulada (e dita
  // na resposta) em vez de derrubar o upload dos leads, que é o crítico.
  if (!LOGIN || !CUSTOMER || !CONV_ACTION || !SUBJECT || !GOOGLE_SA_JSON) {
    return NextResponse.json(
      { error: 'faltam variáveis de ambiente do Google Ads' },
      { status: 500 },
    )
  }

  try {
    const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

    // Leads com gclid que são de fato CAPTAÇÃO, ainda não enviados
    // (`uploaded_to_ads = false`) e dentro da janela de retenção.
    //
    // O form "proposta" é captação por definição. O form "contato" **não**:
    // 7 dos 9 `ASSUNTO_OPTIONS` (`src/lib/form-schemas.ts`) são atendimento a
    // condômino que já é cliente — segunda via de boleto, CND, acordo de
    // pagamento, alteração de titularidade, declaração de quitação, reserva de
    // área comum, dúvida geral. Subir isso como conversão ensinaria o Smart
    // Bidding a comprar clique de quem já é cliente — exatamente o erro que a
    // conta tinha antes (otimizar por pageview/rota no mapa). Só
    // `assunto = 'proposta-comercial'` é pedido de proposta, e aí sim conta,
    // na mesma ação `Proposta (servidor) - gclid` (mesma intenção de compra).
    const { rows: leads } = await query<PendingRow>(
      `select id, created_at, gclid from cms.leads
       where gclid is not null
         and (form = 'proposta' or (form = 'contato' and data->>'assunto' = 'proposta-comercial'))
         and created_at > $1 and uploaded_to_ads = false
       order by created_at desc`,
      [cutoff],
    )

    const { rows: whatsapp } = await query<PendingRow>(
      `select id, created_at, gclid from cms.whatsapp_clicks
       where gclid is not null and created_at > $1 and uploaded_to_ads = false
       order by created_at desc`,
      [cutoff],
    )

    // Token uma vez só, reaproveitado pelos dois lotes.
    let accessToken: string | null = null
    if (leads.length || (whatsapp.length && WA_ACTION)) {
      const sa = JSON.parse(GOOGLE_SA_JSON) as { client_email: string; private_key: string }
      const jwt = new JWT({
        email: sa.client_email,
        key: sa.private_key,
        scopes: [SCOPE],
        subject: SUBJECT,
      })
      accessToken = (await jwt.authorize()).access_token ?? null
    }

    async function uploadBatch(
      rows: PendingRow[],
      destinationId: string,
      table: 'cms.leads' | 'cms.whatsapp_clicks',
      prefix: 'lead' | 'wa',
    ): Promise<BatchResult> {
      if (rows.length === 0) return { considered: 0, ok: true }
      if (!accessToken) return { considered: rows.length, ok: false, skipped: 'sem token' }

      const body = {
        destinations: [
          {
            operatingAccount: { accountType: 'GOOGLE_ADS', accountId: CUSTOMER },
            loginAccount: { accountType: 'GOOGLE_ADS', accountId: LOGIN },
            productDestinationId: destinationId,
          },
        ],
        events: rows.map((row) => ({
          adIdentifiers: { gclid: row.gclid },
          conversionValue: 1,
          currency: 'BRL',
          eventTimestamp: new Date(row.created_at).toISOString(),
          transactionId: `${prefix}-${row.id}`,
          eventSource: 'WEB',
        })),
        consent: { adPersonalization: 'CONSENT_GRANTED', adUserData: 'CONSENT_GRANTED' },
      }

      const res = await fetch(INGEST_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = (await res.json()) as Record<string, unknown>

      // Só marca como enviado depois de confirmar `res.ok` — a API não devolve
      // status por evento individual (é uma chamada "tudo ou nada"), então uma
      // resposta OK cobre todo o lote; uma falha não marca nada, e as linhas
      // voltam a aparecer no SELECT de amanhã (retry natural).
      if (res.ok) {
        await query(`update ${table} set uploaded_to_ads = true where id = any($1::bigint[])`, [
          rows.map((row) => row.id),
        ])
      }

      return {
        considered: rows.length,
        ok: res.ok,
        status: res.status,
        response: JSON.stringify(json).slice(0, 300),
      }
    }

    const leadResult = await uploadBatch(leads, CONV_ACTION, 'cms.leads', 'lead')
    const waResult: BatchResult = WA_ACTION
      ? await uploadBatch(whatsapp, WA_ACTION, 'cms.whatsapp_clicks', 'wa')
      : {
          considered: whatsapp.length,
          ok: true,
          skipped: 'GOOGLE_ADS_WHATSAPP_CONVERSION_ACTION_ID não configurada',
        }

    return NextResponse.json({
      ok: leadResult.ok && waResult.ok,
      leads: leadResult,
      whatsapp: waResult,
    })
  } catch (err) {
    console.error('[cron/upload-ads-conversions] erro:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
