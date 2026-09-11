import 'server-only'

import { parseConsentCookie } from '@/lib/consent'
import { exigeConsentimentoAfirmativo } from '@/lib/consentRegions'

/**
 * Consentimento de publicidade **do visitante**, decidido no servidor no
 * momento em que o lead (ou o clique no WhatsApp) é gravado, para subir junto
 * com a conversão no Google Ads.
 *
 * Por que existe (11/09/2026): o cron `upload-ads-conversions` mandava
 * `adUserData`/`adPersonalization` como `CONSENT_GRANTED` **fixo no código**.
 * Era uma afirmação que o site não tinha como sustentar — e, enquanto o
 * navegador negava os dois sinais para todo mundo, era o oposto do que a
 * própria página declarava. Com o recorte regional do Consent Mode a
 * afirmação virou verdadeira no Brasil, mas continuaria falsa para um
 * visitante europeu. O valor passa a ser calculado por visitante e gravado na
 * linha.
 *
 * A decisão é feita **no servidor**, não no cliente, por dois motivos: o
 * beacon do WhatsApp não é confiável para atribuição (o `gclid` já é lido do
 * cookie pelo mesmo motivo), e o país da requisição é um dado que só o
 * servidor tem.
 *
 * Precedência — a mesma do Consent Mode no navegador:
 *
 * 1. **Escolha explícita** no cookie `semog-consent` (o controle da Política
 *    de Privacidade). No gtag um `consent update` vence o `default`; aqui o
 *    cookie vence a região, inclusive para conceder — um europeu que ligue
 *    marketing na mão concedeu de verdade.
 * 2. **Região da requisição**: EEA, Reino Unido e Suíça negam; o resto
 *    concede. É o espelho exato dos dois `gtag('consent','default', …)` de
 *    `Analytics.tsx`, e a lista de países é a mesma (`consentRegions.ts`), de
 *    propósito num arquivo só.
 */
export type ConsentimentoDeAnuncio = 'granted' | 'denied'

/** Header que a Vercel injeta com o país da requisição (ISO 3166-1 alpha-2). */
const HEADER_PAIS = 'x-vercel-ip-country'

/**
 * Decide o consentimento de publicidade deste visitante.
 *
 * `cookieDeConsentimento` é o valor bruto de `semog-consent` (ou `undefined`),
 * e `paisDaRequisicao` o do header da Vercel. Fora da Vercel o header não
 * existe (`next dev`, teste local) e cai na regra de região: sem país
 * conhecido, não há regra que exija negativa — concede, que é o
 * comportamento correto para o público real do site.
 */
export function consentimentoDeAnuncio(
  cookieDeConsentimento: string | null | undefined,
  paisDaRequisicao: string | null | undefined,
): ConsentimentoDeAnuncio {
  const escolhido = parseConsentCookie(cookieDeConsentimento)
  if (escolhido) return escolhido.marketing ? 'granted' : 'denied'
  return exigeConsentimentoAfirmativo(paisDaRequisicao) ? 'denied' : 'granted'
}

/** Lê o país da requisição do header da Vercel. `null` fora dela. */
export function paisDaRequisicao(headers: Headers): string | null {
  return headers.get(HEADER_PAIS)
}

/**
 * Converte o valor gravado na linha para o enum da Data Manager API.
 *
 * `null` vira `CONSENT_STATUS_UNSPECIFIED`, não `CONSENT_GRANTED`: são as
 * linhas gravadas antes desta coluna existir, e para elas o site realmente não
 * sabe. A população se extingue sozinha — o cron só olha `WINDOW_DAYS` (3
 * dias) para trás.
 */
export function paraDataManager(
  valor: string | null,
): 'CONSENT_GRANTED' | 'CONSENT_DENIED' | 'CONSENT_STATUS_UNSPECIFIED' {
  if (valor === 'granted') return 'CONSENT_GRANTED'
  if (valor === 'denied') return 'CONSENT_DENIED'
  return 'CONSENT_STATUS_UNSPECIFIED'
}
