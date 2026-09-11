/**
 * Territórios onde a regra europeia de consentimento alcança o visitante e,
 * portanto, exige escolha afirmativa antes de medir ou anunciar: os 27 da União
 * Europeia, mais os três do EEA que não são da União (Islândia, Liechtenstein,
 * Noruega), mais Reino Unido e Suíça. São 32.
 *
 * Códigos ISO 3166-2 — é o que o parâmetro `region` do `gtag('consent',
 * 'default', …)` recebe (a doc do Google usa `'ES'` e `'US-AK'` no mesmo
 * exemplo, ou seja, país e subdivisão convivem; aqui só precisamos de país).
 *
 * **Por que a lista existe, e por que ela não pode ser "simplificada" para
 * fora:** o `default` sem `region` vale para TODO visitante. Era assim que o
 * site negava `ad_storage`/`ad_user_data`/`ad_personalization` para o Brasil
 * inteiro — perdendo remarketing em troca de nada, porque a regra que
 * justificava a negativa não alcança o público da Semog (administradora de
 * condomínios no Nordeste, sem cliente europeu). Quem apagar esta lista está
 * escolhendo entre dois erros: negar medição e anúncio no Brasil, ou
 * concedê-los na Europa. A lista é o que evita os dois.
 *
 * Desde 11/09/2026 ela vale para os QUATRO sinais, `analytics_storage`
 * incluído: a fronteira é a mesma, então a regra é uma só.
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
