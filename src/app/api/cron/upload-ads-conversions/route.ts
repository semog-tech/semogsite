import { JWT } from 'google-auth-library'
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

/**
 * Cron (Vercel) — sobe conversões de lead pro Google Ads pelo SERVIDOR, à prova
 * de ad-blocker. O `AttributionTracker` grava o `gclid` num cookie de 1ª parte
 * (não bloqueável) e o `submitForm` (Fase 3/Task 3) salva o lead direto em
 * `cms.leads` (via `pg`, `@/lib/db`), com `gclid`/`email` extraídos pra
 * coluna própria — não há mais nada pra varrer campo por campo. Aqui lemos
 * os leads pendentes (com gclid, do form "proposta", ainda não enviados) e
 * mandamos a conversão pela **Data Manager API** (`events:ingest`) — o método
 * novo do Google (o antigo `UploadClickConversions` foi restrito a contas
 * legadas). Ação de conversão dedicada (UPLOAD_CLICKS, primária) = destino; a
 * `generate_lead` do GA4 fica secundária, sem contagem dupla.
 *
 * Auth: service account + domain-wide delegation com o escopo
 * `https://www.googleapis.com/auth/datamanager` (precisa estar autorizado no
 * Admin do Workspace pro client-id da SA). `CRON_SECRET` (Bearer). Roda
 * 1×/dia (vercel.json).
 *
 * Idempotência: a coluna `cms.leads.uploaded_to_ads` (default `false`) é a
 * fonte de verdade — o SELECT já filtra `uploaded_to_ads = false`, então um
 * lead nunca é considerado 2x, mesmo que o cron rode mais de uma vez no dia
 * ou que um lead antigo saia da janela e volte a entrar (não volta: a janela
 * só encolhe o universo, quem decide é a flag). A janela de `WINDOW_DAYS`
 * continua como cinto-e-suspensório (evita reprocessar todo o histórico se a
 * flag um dia for resetada por engano) e bate com o comportamento anterior.
 * A cada lead soltamos o UPDATE só **depois** da resposta do Google vir OK —
 * se o upload falhar (ou o cron cair no meio), o lead continua com
 * `uploaded_to_ads = false` e é retentado no próximo dia; nunca marcamos
 * antes de confirmar, pra nunca perder uma conversão silenciosamente.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const INGEST_URL = 'https://datamanager.googleapis.com/v1/events:ingest'
const SCOPE = 'https://www.googleapis.com/auth/datamanager'
const WINDOW_DAYS = 3

/** Bigint (`cms.leads.id`) volta do `pg` como string — sem type parser custom. */
type LeadRow = {
  id: string
  created_at: string | Date
  gclid: string
  email: string | null
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
    GOOGLE_ADS_IMPERSONATED_EMAIL: SUBJECT,
    GOOGLE_SA_JSON,
  } = process.env

  if (!LOGIN || !CUSTOMER || !CONV_ACTION || !SUBJECT || !GOOGLE_SA_JSON) {
    return NextResponse.json(
      { error: 'faltam variáveis de ambiente do Google Ads' },
      { status: 500 },
    )
  }

  try {
    // Leads com gclid, do form "proposta" (mesmo escopo de antes — só a
    // Proposta tem ação de conversão dedicada no Ads), ainda não enviados
    // (`uploaded_to_ads = false`) e dentro da janela de retenção.
    const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const { rows: leads } = await query<LeadRow>(
      `select id, created_at, gclid, email from cms.leads
       where gclid is not null and form = 'proposta' and created_at > $1 and uploaded_to_ads = false
       order by created_at desc`,
      [cutoff],
    )

    if (leads.length === 0) {
      return NextResponse.json({
        ok: true,
        considered: 0,
        message: 'nenhum lead com gclid pendente na janela',
      })
    }

    const events = leads.map((lead) => ({
      adIdentifiers: { gclid: lead.gclid },
      conversionValue: 1,
      currency: 'BRL',
      eventTimestamp: new Date(lead.created_at).toISOString(),
      transactionId: String(lead.id),
      eventSource: 'WEB',
    }))

    // Access token via service account + domain-wide delegation (escopo datamanager).
    const sa = JSON.parse(GOOGLE_SA_JSON) as { client_email: string; private_key: string }
    const jwt = new JWT({
      email: sa.client_email,
      key: sa.private_key,
      scopes: [SCOPE],
      subject: SUBJECT,
    })
    const { access_token: accessToken } = await jwt.authorize()

    const body = {
      destinations: [
        {
          operatingAccount: { accountType: 'GOOGLE_ADS', accountId: CUSTOMER },
          loginAccount: { accountType: 'GOOGLE_ADS', accountId: LOGIN },
          productDestinationId: CONV_ACTION,
        },
      ],
      events,
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
    // resposta OK cobre todos os leads deste lote; uma falha não marca
    // nenhum, e eles voltam a aparecer no SELECT de amanhã (retry natural).
    if (res.ok) {
      for (const lead of leads) {
        await query('update cms.leads set uploaded_to_ads = true where id = $1', [lead.id])
      }
    }

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      considered: events.length,
      response: JSON.stringify(json).slice(0, 500),
    })
  } catch (err) {
    console.error('[cron/upload-ads-conversions] erro:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
