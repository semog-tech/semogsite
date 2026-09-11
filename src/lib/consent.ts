/**
 * Consentimento de cookies (LGPD). Módulo "client-safe": pode ser importado
 * de Server ou Client Components — as funções que tocam `document` checam
 * o ambiente antes de rodar, então importar isto num RSC não quebra nada
 * (só não terão efeito até rodar no browser).
 */

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing'
export type Consent = Record<ConsentCategory, boolean>

export const CONSENT_COOKIE_NAME = 'semog-consent'
const CONSENT_COOKIE_MAX_AGE_DAYS = 180

/**
 * Estado que vale enquanto o visitante não escolheu nada — e que é o mesmo
 * estado que o `Analytics` declara no `gtag('consent','default')` fora dos
 * territórios que exigem escolha afirmativa (ver `consentRegions.ts`).
 *
 * `analytics` e `marketing` nascem `true` porque é essa a realidade desde
 * 11/09/2026: o site não pede consentimento prévio no Brasil (legítimo
 * interesse, medição de 1ª parte) e a revogação vive na Política de
 * Privacidade. Antes nasciam `false`, o que descrevia mal o comportamento e
 * ainda fazia o `consent update` do mount negar publicidade no mundo inteiro.
 *
 * **Ressalva**: nos 32 territórios de `consentRegions.ts` o padrão real é
 * negado — nos quatro sinais, `analytics_storage` incluído —, e isso é imposto
 * pelo `region` do Consent Mode, no navegador. Esta constante não sabe o país:
 * ela só alimenta o estado inicial do controle na Política de Privacidade. Um
 * visitante de lá que abra aquela página veria os interruptores ligados. Fica
 * assim de propósito, e sem dano: só um clique em "Salvar preferências" muda
 * algo, e o botão só habilita depois de uma mudança real (ver
 * `blocks/CookiePreferences/Component.tsx`), então ninguém concede por inércia.
 */
export const defaultConsent: Consent = {
  necessary: true,
  analytics: true,
  marketing: true,
}

function isBrowser(): boolean {
  return typeof document !== 'undefined'
}

function isConsent(value: unknown): value is Consent {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.necessary === 'boolean' &&
    typeof v.analytics === 'boolean' &&
    typeof v.marketing === 'boolean'
  )
}

function readCookieRaw(name: string): string | null {
  if (!isBrowser()) return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function writeCookieRaw(name: string, value: string, days: number): void {
  if (!isBrowser()) return
  const maxAge = days * 24 * 60 * 60
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''
  // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API não tem suporte em Safari/Firefox; cookie de consentimento é simples o bastante pra não justificar um polyfill.
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax${secure}`
}

/** Faz o parse de um valor bruto (string) de cookie de consentimento; `null` se ausente/inválido. */
export function parseConsentCookie(raw: string | null | undefined): Consent | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!isConsent(parsed)) return null
    return { ...parsed, necessary: true }
  } catch {
    return null
  }
}

/**
 * Lê o consentimento salvo no cookie do browser. `null` = usuário ainda não decidiu.
 * CLIENT-ONLY: reads `document.cookie`, so returns `null` on server (fail-closed).
 */
export function getConsent(): Consent | null {
  return parseConsentCookie(readCookieRaw(CONSENT_COOKIE_NAME))
}

/** Persiste a decisão do usuário no cookie `semog-consent` (~180 dias). */
export function setConsent(consent: Consent): void {
  const value: Consent = { ...consent, necessary: true }
  writeCookieRaw(CONSENT_COOKIE_NAME, JSON.stringify(value), CONSENT_COOKIE_MAX_AGE_DAYS)
}

/**
 * `true` se a categoria pode rodar agora. `necessary` é sempre `true`; as
 * demais saem do cookie salvo e, sem cookie, do `defaultConsent` — que é o
 * estado que de fato vale para quem não escolheu (ver a doc daquela
 * constante). CLIENT-ONLY: no servidor não há `document.cookie`, então cai no
 * padrão.
 */
export function hasConsent(category: ConsentCategory): boolean {
  if (category === 'necessary') return true
  return getConsent()?.[category] ?? defaultConsent[category]
}
