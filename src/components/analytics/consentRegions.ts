/**
 * Territórios onde a política de consentimento do Google (DMA) exige escolha
 * afirmativa antes de qualquer sinal de publicidade: os 27 do EEA, mais os três
 * do EEA que não são da União (Islândia, Liechtenstein, Noruega), mais Reino
 * Unido e Suíça.
 *
 * Códigos ISO 3166-2 — é o que o parâmetro `region` do `gtag('consent',
 * 'default', …)` recebe (a doc do Google usa `'ES'` e `'US-AK'` no mesmo
 * exemplo, ou seja, país e subdivisão convivem; aqui só precisamos de país).
 *
 * Por que a lista existe: o `default` sem `region` vale para TODO visitante, e
 * era assim que o site negava `ad_storage`/`ad_user_data`/`ad_personalization`
 * para o Brasil inteiro — perdendo remarketing em troca de nada, já que a regra
 * que justificava a negativa não alcança o público da Semog. Com a lista, a
 * negativa vale só onde a regra existe.
 *
 * A MESMA lista é usada no servidor, em `src/lib/adsConsent.ts`, para decidir o
 * consentimento que sobe junto com a conversão. As duas pontas precisam
 * concordar, então a lista mora num lugar só.
 */
export const REGIOES_COM_CONSENTIMENTO_OBRIGATORIO = [
  // União Europeia (27)
  'AT',
  'BE',
  'BG',
  'CY',
  'CZ',
  'DE',
  'DK',
  'EE',
  'ES',
  'FI',
  'FR',
  'GR',
  'HR',
  'HU',
  'IE',
  'IT',
  'LT',
  'LU',
  'LV',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SE',
  'SI',
  'SK',
  // EEA fora da União
  'IS',
  'LI',
  'NO',
  // Reino Unido e Suíça
  'CH',
  'GB',
] as const

/** `true` se o país (ISO 3166-1 alpha-2) exige consentimento afirmativo. */
export function exigeConsentimentoAfirmativo(pais: string | null | undefined): boolean {
  if (!pais) return false
  const codigo = pais.trim().toUpperCase()
  return (REGIOES_COM_CONSENTIMENTO_OBRIGATORIO as readonly string[]).includes(codigo)
}
