import { JWT } from 'google-auth-library'
import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

/**
 * Cron (Vercel) — sobe conversões de lead pro Google Ads pelo SERVIDOR, à prova
 * de ad-blocker. O `AttributionTracker` grava o `gclid` num cookie de 1ª parte
 * (não bloqueável) e o `submitForm` salva junto do lead em `form-submissions`
 * (campo "origem — gclid (Google Ads)"). Aqui lemos os leads recentes com gclid
 * e mandamos a conversão pela **Data Manager API** (`events:ingest`) — o método
 * novo do Google (o antigo `UploadClickConversions` foi restrito a contas
 * legadas). Ação de conversão dedicada (UPLOAD_CLICKS, primária) = destino; a
 * `generate_lead` do GA4 fica secundária, sem contagem dupla.
 *
 * Auth: service account + domain-wide delegation com o escopo
 * `https://www.googleapis.com/auth/datamanager` (precisa estar autorizado no
 * Admin do Workspace pro client-id da SA). Idempotente: `transactionId` = id da
 * submissão + janela de 3 dias. `CRON_SECRET` (Bearer). Roda 1×/dia (vercel.json).
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const INGEST_URL = 'https://datamanager.googleapis.com/v1/events:ingest'
const SCOPE = 'https://www.googleapis.com/auth/datamanager'
const GCLID_FIELD = 'origem — gclid (Google Ads)'
const WINDOW_DAYS = 3

type SubmissionField = { field: string; value: string }

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
    const payload = await getPayloadClient()
    const forms = await payload.find({
      collection: 'forms',
      where: { title: { equals: 'Proposta' } },
      limit: 1,
      depth: 0,
    })
    const formId = forms.docs[0]?.id
    if (!formId) {
      return NextResponse.json({ error: 'form "Proposta" não encontrado' }, { status: 500 })
    }

    const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const subs = await payload.find({
      collection: 'form-submissions',
      where: { and: [{ form: { equals: formId } }, { createdAt: { greater_than: cutoff } }] },
      limit: 500,
      depth: 0,
      sort: '-createdAt',
    })

    const events: Record<string, unknown>[] = []
    for (const doc of subs.docs) {
      const fields = (doc.submissionData ?? []) as SubmissionField[]
      const gclid = fields.find((f) => f.field === GCLID_FIELD)?.value
      if (!gclid) continue
      events.push({
        adIdentifiers: { gclid },
        conversionValue: 1,
        currency: 'BRL',
        eventTimestamp: new Date(doc.createdAt as string).toISOString(),
        transactionId: String(doc.id),
        eventSource: 'WEB',
      })
    }

    if (events.length === 0) {
      return NextResponse.json({
        ok: true,
        considered: 0,
        message: 'nenhum lead com gclid na janela',
      })
    }

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
