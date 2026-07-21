export {}

declare global {
  interface Window {
    dataLayer?: unknown[]
    /** gtag.js (definido pelo script beforeInteractive de `Analytics`); shim de `dataLayer.push` até a lib carregar. */
    gtag?: (...args: unknown[]) => void
  }
}
