/**
 * Atribuição de origem do lead (1ª parte). O `AttributionTracker` (client)
 * captura no navegador utm_*, click IDs (gclid/gbraid/wbraid/fbclid/msclkid),
 * referrer e página de entrada, e guarda no cookie `semog-attrib` (first-touch
 * preservado + last-touch). Aqui ficam os utilitários **server-safe** (sem DOM)
 * que traduzem isso em rótulos legíveis pro e-mail de notificação do lead e pro
 * registro em `form-submissions`.
 *
 * Base legal: interesse legítimo — dado de 1ª parte, sem compartilhamento com
 * terceiros, usado só pra entender/rotear de onde veio cada lead (mesma pegada
 * do analytics). Ver `@/components/analytics/AttributionTracker`.
 */

export const ATTRIBUTION_COOKIE = 'semog-attrib'

export type AttributionTouch = {
  source?: string
  medium?: string
  campaign?: string
  term?: string
  content?: string
  gclid?: string
  gbraid?: string
  wbraid?: string
  fbclid?: string
  msclkid?: string
  referrer?: string
  landing?: string
  ts?: string
}

export type Attribution = {
  first: AttributionTouch
  last: AttributionTouch
}

export type AttributionField = { label: string; value: string }

/** Host de uma URL sem `www.` — string vazia se não parsear. */
function hostOf(url: string | undefined): string {
  if (!url) return ''
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/** Tem algum sinal de campanha/clique/referência? (decide o last-touch). */
export function touchHasSignal(t: AttributionTouch): boolean {
  return Boolean(
    t.gclid ||
      t.gbraid ||
      t.wbraid ||
      t.fbclid ||
      t.msclkid ||
      t.source ||
      t.medium ||
      t.campaign ||
      t.referrer,
  )
}

/**
 * Lê o cookie de atribuição no servidor. O valor é gravado com
 * `encodeURIComponent(JSON)`; tenta decodificar e, se falhar, faz parse direto
 * (defensivo). `null` quando ausente/ilegível.
 */
export function parseAttributionCookie(raw: string | undefined): Attribution | null {
  if (!raw) return null
  for (const candidate of [raw, safeDecode(raw)]) {
    if (!candidate) continue
    try {
      return JSON.parse(candidate) as Attribution
    } catch {
      // tenta o próximo candidato
    }
  }
  return null
}

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

/**
 * Classifica o canal de um toque no estilo GA4 (pago / orgânica / social /
 * referência / direto), em pt-BR pra cair direto no e-mail.
 */
export function classifyChannel(t: AttributionTouch): string {
  const medium = (t.medium ?? '').toLowerCase()
  const source = (t.source ?? '').toLowerCase()

  if (t.gclid || t.gbraid || t.wbraid || /^(cpc|ppc|paid|paidsearch|paid_search)$/.test(medium)) {
    return 'Google Ads (tráfego pago)'
  }
  if (t.msclkid) return 'Microsoft Ads (tráfego pago)'
  if (medium === 'organic') return `Busca orgânica${source ? ` (${source})` : ''}`
  if (t.fbclid || /(facebook|instagram|meta)/.test(source)) return 'Redes sociais (Meta)'
  if (t.campaign || t.source) {
    return `Campanha: ${t.campaign ?? '—'} (${t.source ?? '?'} / ${t.medium ?? '?'})`
  }
  const host = hostOf(t.referrer)
  if (host) {
    if (/(^|\.)google\./.test(host)) return 'Busca orgânica (Google)'
    if (/(bing|yahoo|duckduckgo|ecosia)\./.test(host)) return 'Busca orgânica'
    if (/(facebook|instagram|linkedin|twitter|x\.com|t\.co|youtube|whatsapp)/.test(host)) {
      return `Redes sociais (${host})`
    }
    return `Referência: ${host}`
  }
  return 'Direto / desconhecido'
}

/**
 * Linhas legíveis pra seção "Origem do lead" (e-mail + registro no banco).
 * Prioriza o first-touch (de onde o lead veio originalmente) e só mostra o
 * last-touch quando é de um canal diferente.
 */
export function buildAttributionFields(attr: Attribution | null): AttributionField[] {
  if (!attr?.first) return []
  const { first, last } = attr
  const fields: AttributionField[] = []

  fields.push({ label: 'Canal (origem)', value: classifyChannel(first) })

  const campaignParts = [
    first.campaign && `campanha: ${first.campaign}`,
    first.term && `termo: ${first.term}`,
    first.content && `conteúdo: ${first.content}`,
  ].filter(Boolean) as string[]
  if (campaignParts.length) fields.push({ label: 'Campanha', value: campaignParts.join(' · ') })

  const refHost = hostOf(first.referrer)
  if (refHost) fields.push({ label: 'Veio do site', value: refHost })

  if (first.landing) fields.push({ label: 'Página de entrada', value: first.landing })

  const clickId = first.gclid ?? first.gbraid ?? first.wbraid
  if (clickId) fields.push({ label: 'gclid (Google Ads)', value: clickId })

  // Último toque só se for canal diferente do primeiro (ex.: entrou orgânico,
  // voltou pelo Ads e converteu).
  if (last && touchHasSignal(last) && classifyChannel(last) !== classifyChannel(first)) {
    fields.push({ label: 'Último toque', value: classifyChannel(last) })
  }

  return fields
}
