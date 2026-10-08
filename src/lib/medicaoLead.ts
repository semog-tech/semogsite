/**
 * Conversão de lead → GA4 `generate_lead`. É evento-chave no GA4 e conversão
 * importada no Google Ads; o Consent Mode (ver `Analytics`) decide o que sai.
 * Fonte única do formato (`currency: 'BRL'`, `value: 1`) para os formulários que
 * captam lead — `extras` carrega só o que diferencia a variante (ex.: `variante`).
 * Nenhum dado pessoal entra aqui.
 */
export function registrarLeadGerado(form: string, extras: Record<string, string> = {}) {
  window.gtag?.('event', 'generate_lead', { form, ...extras, currency: 'BRL', value: 1 })
}
