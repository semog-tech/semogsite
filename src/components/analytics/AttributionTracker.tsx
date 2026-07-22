'use client'

import { useEffect } from 'react'
import {
  ATTRIBUTION_COOKIE,
  type Attribution,
  type AttributionTouch,
  touchHasSignal,
} from '@/lib/attribution'

const MAX_AGE_DAYS = 90

/** Referrer externo — ignora navegação dentro do próprio site. */
function externalReferrer(): string | undefined {
  const ref = document.referrer
  if (!ref) return undefined
  try {
    if (new URL(ref).host === window.location.host) return undefined
  } catch {
    return undefined
  }
  return ref
}

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : undefined
}

/**
 * Captura a origem do visitante no primeiro carregamento (utm_*, gclid e afins,
 * referrer, página de entrada) e guarda no cookie `semog-attrib` — first-touch
 * preservado, last-touch atualizado quando há novo sinal de campanha/clique.
 * O `submitForm` lê esse cookie no servidor e anexa a origem ao e-mail do lead
 * (ver `@/lib/attribution`). Cookie de 1ª parte (interesse legítimo), não é lido
 * por terceiros. Renderiza `null`.
 */
export function AttributionTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const pick = (key: string) => params.get(key) || undefined

    const current: AttributionTouch = {
      source: pick('utm_source'),
      medium: pick('utm_medium'),
      campaign: pick('utm_campaign'),
      term: pick('utm_term'),
      content: pick('utm_content'),
      gclid: pick('gclid'),
      gbraid: pick('gbraid'),
      wbraid: pick('wbraid'),
      fbclid: pick('fbclid'),
      msclkid: pick('msclkid'),
      referrer: externalReferrer(),
      landing: window.location.pathname,
      ts: new Date().toISOString(),
    }

    let existing: Attribution | null = null
    const raw = readCookie(ATTRIBUTION_COOKIE)
    if (raw) {
      try {
        existing = JSON.parse(raw) as Attribution
      } catch {
        existing = null
      }
    }

    const next: Attribution = existing
      ? { first: existing.first, last: touchHasSignal(current) ? current : existing.last }
      : { first: current, last: current }

    // Só reescreve quando algo mudou (1ª visita ou novo sinal de origem).
    const serialized = JSON.stringify(next)
    if (existing && serialized === JSON.stringify(existing)) return

    const maxAge = MAX_AGE_DAYS * 24 * 60 * 60
    // biome-ignore lint/suspicious/noDocumentCookie: uso proposital — document.cookie tem suporte universal; a Cookie Store API ainda não roda em Safari/Firefox
    document.cookie = `${ATTRIBUTION_COOKIE}=${encodeURIComponent(serialized)}; path=/; max-age=${maxAge}; SameSite=Lax`
  }, [])

  return null
}
