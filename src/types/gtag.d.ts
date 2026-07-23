export {}

declare global {
  interface Window {
    dataLayer?: unknown[]
    /** gtag.js (definido pelo script beforeInteractive de `Analytics`); shim de `dataLayer.push` até a lib carregar. */
    gtag?: (...args: unknown[]) => void
    /** Microsoft Clarity (fila definida pelo script beforeInteractive de `Clarity`); processa quando a lib carrega. */
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[] }
  }
}
