import { ATTRIBUTION_COOKIE, type AttributionTouch } from '@/lib/attribution'

/**
 * O lado do navegador da origem do lead. Só roda no cliente (usa `window`,
 * `document` e `sessionStorage`), chamado pelo `AttributionTracker` no
 * carregamento e pelos formulários no envio.
 *
 * O cookie `semog-attrib` continua sendo o caminho principal. Este módulo existe
 * para o caso em que ele não chega ao servidor (ver `@/lib/origemDoLead`): o
 * tracker guarda a mesma atribuição na `sessionStorage`, e o formulário manda o
 * que achar junto com o envio, num argumento que a pessoa não vê.
 */

/** Mesma chave do cookie, na `sessionStorage`. */
const CHAVE_NA_SESSAO = ATTRIBUTION_COOKIE

/** Referrer externo — ignora navegação dentro do próprio site. */
function referrerExterno(): string | undefined {
  const ref = document.referrer
  if (!ref) return undefined
  try {
    if (new URL(ref).host === window.location.host) return undefined
  } catch {
    return undefined
  }
  return ref
}

/** O toque desta página: utm_*, click ids, referrer externo e caminho. */
export function toqueDaUrl(): AttributionTouch {
  const params = new URLSearchParams(window.location.search)
  const pick = (key: string) => params.get(key) || undefined
  return {
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
    referrer: referrerExterno(),
    landing: window.location.pathname,
    ts: new Date().toISOString(),
  }
}

/** Valor cru (JSON) do cookie de atribuição; `undefined` se ausente ou malformado. */
export function lerCookieDeAtribuicao(): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${ATTRIBUTION_COOKIE}=([^;]*)`))
  if (!match) return undefined
  try {
    return decodeURIComponent(match[1])
  } catch {
    // Escape `%` quebrado: tratar como ausente, e não derrubar o tracker.
    return undefined
  }
}

/**
 * Guarda a atribuição na `sessionStorage`. O acesso lança em navegador com
 * armazenamento bloqueado; aí só não há cópia, e o cookie segue sendo tentado.
 */
export function guardarNaSessao(serializado: string): void {
  try {
    window.sessionStorage.setItem(CHAVE_NA_SESSAO, serializado)
  } catch {
    // Sem armazenamento: o formulário ainda cai para a URL atual.
  }
}

/** A cópia da atribuição na `sessionStorage`, se houver. */
export function lerDaSessao(): string | undefined {
  try {
    return window.sessionStorage.getItem(CHAVE_NA_SESSAO) ?? undefined
  } catch {
    return undefined
  }
}

/**
 * O que o formulário manda junto do envio: o cookie, senão a cópia da sessão,
 * senão o toque da URL atual. Sempre devolve algo — no último caso ao menos a
 * página e o `fbclid`/`gclid` que estiverem nela. O servidor valida tudo.
 */
export function lerOrigemDoNavegador(): string {
  const guardado = lerCookieDeAtribuicao() ?? lerDaSessao()
  if (guardado) return guardado
  const toque = toqueDaUrl()
  return JSON.stringify({ first: toque, last: toque })
}
