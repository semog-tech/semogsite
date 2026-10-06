export {}

declare global {
  interface Window {
    dataLayer?: unknown[]
    /** gtag.js (definido pelos scripts `ga-consent-default`/`ga-init` de `Analytics`, o que rodar primeiro); shim de `dataLayer.push` até a lib carregar. */
    gtag?: (...args: unknown[]) => void
    /** Microsoft Clarity (fila definida pelo script beforeInteractive de `Clarity`); processa quando a lib carrega. */
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[] }
  }
}
