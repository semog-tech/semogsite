'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import { REGIOES_COM_CONSENTIMENTO_OBRIGATORIO } from '@/lib/consentRegions'
import { useConsent } from '@/providers/ConsentProvider'
import { IS_MEASURABLE_HOST_JS } from './measurableHost'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

/**
 * GA4 (gtag.js) com **Google Consent Mode v2**, no modelo "legítimo interesse
 * para analytics" (o site só faz medição de 1ª parte, sem cookies de anúncio):
 * - `analytics_storage` liga **por padrão** (antes mesmo da escolha), com
 *   opt-out na Política de Privacidade.
 * - `ad_storage`/`ad_user_data`/`ad_personalization` ficam negados por padrão
 *   **só nos territórios que exigem consentimento afirmativo** (EEA, Reino
 *   Unido, Suíça — ver `consentRegions.ts`); no resto do mundo valem concedidos.
 *
 * **O `region` não é detalhe** (11/09/2026): até aqui os três sinais de
 * publicidade eram negados num `default` SEM `region`, e a doc do Google é
 * explícita — um default sem região vale para todos os visitantes. Ou seja, o
 * site negava remarketing para o público brasileiro inteiro para cumprir uma
 * regra que não alcança esse público. A conversão não era afetada (não há tag
 * `AW-` no site; as conversões sobem pelo servidor, via Data Manager API), mas
 * o remarketing era perdido de graça.
 *
 * `page_view` fica por conta do próprio GA4: o `config` manda o da carga inicial
 * e o **Enhanced Measurement** do fluxo Web cobre as navegações SPA (history
 * events do App Router) — por isso NÃO enviamos `page_view` manual (evita
 * duplicação). No-op sem `NEXT_PUBLIC_GA_ID`.
 *
 * O `gtag.js` só é carregado nos hosts de produção (ver `IS_MEASURABLE_HOST_JS`):
 * fora deles o `config` nem roda, então `next dev` e preview não geram sessão.
 * O `consent default` continua sendo definido em todo host — é só estado local,
 * não gera hit, e mantém o shim/fila coerentes.
 */
export function Analytics() {
  const { consent, decided } = useConsent()

  /**
   * Só manda `consent update` depois de uma escolha EXPLÍCITA do visitante (na
   * Política de Privacidade). Enquanto `decided` é falso, valem os defaults
   * declarados abaixo — e é justamente isso que preserva o recorte por região:
   * `consent update` não aceita `region`, então um update disparado no mount
   * sobrescreveria o default regional para todo mundo. Era o que acontecia
   * antes: `consent.marketing` nasce `false`, logo o update negava os três
   * sinais de publicidade em qualquer país, anulando o `region`.
   */
  useEffect(() => {
    if (!GA_ID || !decided) return
    window.gtag?.('consent', 'update', {
      analytics_storage: consent.analytics ? 'granted' : 'denied',
      ad_storage: consent.marketing ? 'granted' : 'denied',
      ad_user_data: consent.marketing ? 'granted' : 'denied',
      ad_personalization: consent.marketing ? 'granted' : 'denied',
    })
  }, [decided, consent.analytics, consent.marketing])

  if (!GA_ID) return null

  return (
    <>
      {/* Dois `default`: o primeiro recorta os territórios que exigem escolha
          afirmativa, o segundo é o padrão de quem não está neles. É a ordem do
          exemplo da doc do Google (região primeiro, fallback depois). */}
      <Script id="ga-consent-default" strategy="beforeInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted',region:${JSON.stringify(REGIOES_COM_CONSENTIMENTO_OBRIGATORIO)}});
gtag('consent','default',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'});`}
      </Script>
      <Script id="ga-init" strategy="afterInteractive">
        {`if(${IS_MEASURABLE_HOST_JS}){var s=document.createElement('script');s.async=1;s.src='https://www.googletagmanager.com/gtag/js?id=${GA_ID}';document.head.appendChild(s);gtag('js',new Date());gtag('config','${GA_ID}');}`}
      </Script>
    </>
  )
}
