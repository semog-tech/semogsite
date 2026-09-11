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
 * Valor usado quando a requisição **não traz país** — header ausente ou vazio.
 *
 * Está numa constante nomeada, e não escondido num `??` no fim de uma
 * expressão, porque é uma escolha e não um resto: "não sei onde a pessoa está"
 * é um terceiro caso, diferente de "sei que é Europa" e de "sei que não é".
 *
 * Escolhido `granted` porque o caso real é local — `next dev`, teste de
 * integração, qualquer execução fora da Vercel, onde o header simplesmente não
 * existe e não há visitante nenhum. Em produção o header vem em toda
 * requisição; se ele sumir em massa lá, o sintoma é conversão sendo enviada
 * como concedida para gente cuja região não foi verificada — e é por isso que
 * isto está escrito aqui, e não deduzido de um operador.
 */
const SEM_PAIS_CONHECIDO: ConsentimentoDeAnuncio = 'granted'

/**
 * Decide o consentimento de publicidade deste visitante.
 *
 * `cookieDeConsentimento` é o valor bruto de `semog-consent` (ou `undefined`),
 * e `pais` o do header da Vercel. Os três casos são explícitos, nesta ordem.
 */
export function consentimentoDeAnuncio(
  cookieDeConsentimento: string | null | undefined,
  pais: string | null | undefined,
): ConsentimentoDeAnuncio {
  // 1. Escolha explícita do visitante vence tudo — inclusive para conceder.
  const escolhido = parseConsentCookie(cookieDeConsentimento)
  if (escolhido) return escolhido.marketing ? 'granted' : 'denied'

  // 2. Sem país, sem como aplicar a regra de região.
  if (!pais?.trim()) return SEM_PAIS_CONHECIDO

  // 3. Região: os 32 territórios de `consentRegions.ts` negam; o resto concede.
  return exigeConsentimentoAfirmativo(pais) ? 'denied' : 'granted'
}

/** Lê o país da requisição do header da Vercel. `null` fora dela. */
export function paisDaRequisicao(headers: Headers): string | null {
  return headers.get(HEADER_PAIS)
}

/**
 * Converte o valor gravado na linha para o enum da Data Manager API.
 *
 * **`null` vira `CONSENT_GRANTED`, e isso é temporário** — decisão de
 * 11/09/2026, com prazo de validade de três dias a partir do deploy. Linha com
 * `ads_consent` nulo é linha gravada ANTES desta coluna existir, e o cron só
 * olha `WINDOW_DAYS` (3 dias) para trás: passado esse prazo, não há mais
 * nenhuma, e este ramo deixa de ser alcançado.
 *
 * **Tamanho real da população, medido em 11/09/2026: UMA linha** — 1 em
 * `cms.leads` e 0 em `cms.whatsapp_clicks`. Contagem reproduzível:
 *
 *     select count(*) from cms.leads
 *      where gclid is not null and uploaded_to_ads = false
 *        and created_at > now() - interval '3 days';
 *
 * (Havia uma segunda linha pendente em `cms.leads`, mas fora da janela de 3
 * dias — o cron nunca a alcança, com ou sem esta regra.)
 *
 * Por que concedido e não "não sei": essas linhas foram coletadas sob o regime
 * ANTIGO, com o banner no ar, então parte dessas pessoas de fato aceitou —
 * mandar `UNSPECIFIED` descartaria informação verdadeira. E as que não
 * aceitaram são tráfego brasileiro, para quem o desenho novo concede por
 * padrão; ou seja, `CONSENT_GRANTED` é o valor que valeria para elas hoje.
 * `UNSPECIFIED` seria a escolha certa se houvesse chance de europeu nessa
 * população — não há, e o custo de "não sei" recairia sobre conversão real de
 * lead brasileiro.
 *
 * Valor gravado que não seja 'granted' nem 'denied' é outra coisa: não é linha
 * legada, é defeito. Esse vai como `UNSPECIFIED`, para não virar uma afirmação
 * inventada em cima de um bug.
 */
export function paraDataManager(
  valor: string | null,
): 'CONSENT_GRANTED' | 'CONSENT_DENIED' | 'CONSENT_STATUS_UNSPECIFIED' {
  if (valor === 'granted') return 'CONSENT_GRANTED'
  if (valor === 'denied') return 'CONSENT_DENIED'
  if (valor === null) return 'CONSENT_GRANTED'
  return 'CONSENT_STATUS_UNSPECIFIED'
}
