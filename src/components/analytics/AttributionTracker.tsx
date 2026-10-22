'use client'

import { useEffect } from 'react'
import { ATTRIBUTION_COOKIE, type Attribution, touchHasSignal } from '@/lib/attribution'
import {
  guardarNaSessao,
  lerCookieDeAtribuicao,
  lerDaSessao,
  toqueDaUrl,
} from '@/lib/origemDoNavegador'

const MAX_AGE_DAYS = 90

/**
 * Captura a origem do visitante no primeiro carregamento (utm_*, gclid e afins,
 * referrer, página de entrada) e guarda no cookie `semog-attrib` — first-touch
 * preservado, last-touch atualizado quando há novo sinal de campanha/clique.
 * O `submitForm` lê esse cookie no servidor e anexa a origem ao e-mail do lead
 * (ver `@/lib/attribution`); a mesma atribuição fica na `sessionStorage`, de
 * onde o formulário a reenvia quando o cookie não chega (ver
 * `@/lib/origemDoLead`). Cookie de 1ª parte (interesse legítimo), não é lido por
 * terceiros. Renderiza `null`.
 */
export function AttributionTracker() {
  useEffect(() => {
    const current = toqueDaUrl()

    let existing: Attribution | null = null
    // Sem cookie (bloqueado, ou não gravado neste navegador), o primeiro toque
    // vem da cópia da sessão: sem ela, cada página nova sobrescreveria o toque
    // de entrada (o que tinha o `fbclid`) pelo da página atual.
    const raw = lerCookieDeAtribuicao() ?? lerDaSessao()
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

    // Cópia na sessão a cada carregamento, mesmo sem mudança: é o que o
    // formulário manda quando o cookie não chega ao servidor (ver
    // `@/lib/origemDoNavegador`), e precisa existir mesmo com o cookie bloqueado.
    const serialized = JSON.stringify(next)
    guardarNaSessao(serialized)

    // O cookie só é reescrito quando algo mudou (1ª visita ou novo sinal de origem).
    if (existing && serialized === JSON.stringify(existing)) return

    const maxAge = MAX_AGE_DAYS * 24 * 60 * 60
    // biome-ignore lint/suspicious/noDocumentCookie: uso proposital — document.cookie tem suporte universal; a Cookie Store API ainda não roda em Safari/Firefox
    document.cookie = `${ATTRIBUTION_COOKIE}=${encodeURIComponent(serialized)}; path=/; max-age=${maxAge}; SameSite=Lax`
  }, [])

  return null
}
