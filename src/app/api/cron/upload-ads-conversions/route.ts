import { JWT } from 'google-auth-library'
import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

/**
 * Cron (Vercel) — sobe conversões de lead pro Google Ads pelo SERVIDOR, à prova
 * de ad-blocker. O `AttributionTracker` grava o `gclid` num cookie de 1ª parte
 * (não bloqueável) e o `submitForm` salva junto do lead em `form-submissions`
 * (campo "origem — gclid (Google Ads)"). Aqui lemos os leads recentes com gclid
 * e mandamos a conversão direto pra Ads API (upload de click conversions),
 * atribuindo ao clique exato. Ação de conversão dedicada (UPLOAD_CLICKS,
 * primária) — a `generate_lead` do GA4 fica secundária, sem contagem dupla.
 *
 * Idempotente: janela de 3 dias + `partialFailure` + counting ONE_PER_CLICK do
 * Ads (reenvio do mesmo clique conta 1 só). Auth por `CRON_SECRET` (Bearer).
 * Roda 1×/dia (cron do `vercel.json`), suficiente (Ads aceita conversão offline
 * até 90 dias após o clique).
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const ADS_API_VERSION = 'v25'
const GCLID_FIELD = 'origem — gclid (Google Ads)'
const WINDOW_DAYS = 3

type SubmissionField = { field: string; value: string }

/** "yyyy-MM-dd HH:mm:ss-03:00" — America/Recife (UTC-3, sem horário de verão). */
function toAdsDateTime(d: Date): string {
  const local = new Date(d.getTime() - 3 * 60 * 60 * 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return (
    `${local.getUTCFullYear()}-${p(local.getUTCMonth() + 1)}-${p(local.getUTCDate())} ` +
    `${p(local.getUTCHours())}:${p(local.getUTCMinutes())}:${p(local.getUTCSeconds())}-03:00`
  )
}

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const {
    GOOGLE_ADS_DEVELOPER_TOKEN,
    GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    GOOGLE_ADS_CUSTOMER_ID,
    GOOGLE_ADS_CONVERSION_ACTION_ID,
    GOOGLE_ADS_IMPERSONATED_EMAIL,
    GOOGLE_SA_JSON,
  } = process.env

  if (
    !GOOGLE_ADS_DEVELOPER_TOKEN ||
    !GOOGLE_ADS_LOGIN_CUSTOMER_ID ||
    !GOOGLE_ADS_CUSTOMER_ID ||
    !GOOGLE_ADS_CONVERSION_ACTION_ID ||
    !GOOGLE_ADS_IMPERSONATED_EMAIL ||
    !GOOGLE_SA_JSON
  ) {
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

    const conversionAction = `customers/${GOOGLE_ADS_CUSTOMER_ID}/conversionActions/${GOOGLE_ADS_CONVERSION_ACTION_ID}`
    const conversions: Record<string, unknown>[] = []
    for (const doc of subs.docs) {
      const fields = (doc.submissionData ?? []) as SubmissionField[]
      const gclid = fields.find((f) => f.field === GCLID_FIELD)?.value
      if (!gclid) continue
      conversions.push({
        gclid,
        conversionAction,
        conversionDateTime: toAdsDateTime(new Date(doc.createdAt as string)),
        conversionValue: 1,
        currencyCode: 'BRL',
      })
    }

    if (conversions.length === 0) {
      return NextResponse.json({
        ok: true,
        considered: 0,
        message: 'nenhum lead com gclid na janela',
      })
    }

    // Mint de access token via service account + domain-wide delegation (adwords).
    const sa = JSON.parse(GOOGLE_SA_JSON) as { client_email: string; private_key: string }
    const jwt = new JWT({
      email: sa.client_email,
      key: sa.private_key,
      scopes: ['https://www.googleapis.com/auth/adwords'],
      subject: GOOGLE_ADS_IMPERSONATED_EMAIL,
    })
    const { access_token: accessToken } = await jwt.authorize()

    const url = `https://googleads.googleapis.com/${ADS_API_VERSION}/customers/${GOOGLE_ADS_CUSTOMER_ID}:uploadClickConversions`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
        'login-customer-id': GOOGLE_ADS_LOGIN_CUSTOMER_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversions, partialFailure: true }),
    })
    const json = (await res.json()) as {
      results?: unknown[]
      partialFailureError?: { message?: string }
      error?: { message?: string }
    }

    const accepted = Array.isArray(json.results)
      ? json.results.filter((r) => r && Object.keys(r as object).length > 0).length
      : 0

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      considered: conversions.length,
      accepted,
      partialFailure: json.partialFailureError?.message ?? null,
      error: json.error?.message ?? null,
    })
  } catch (err) {
    console.error('[cron/upload-ads-conversions] erro:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
