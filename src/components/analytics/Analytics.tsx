'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useEffect, useRef } from 'react'
import { useConsent } from '@/providers/ConsentProvider'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

/**
 * GA4 (gtag.js) com **Google Consent Mode v2**, integrado ao `ConsentProvider`
 * (LGPD). Comportamento:
 * - `consent default` = TUDO negado antes da escolha do usuário — nenhum cookie
 *   de analytics/ads até o consentimento (`wait_for_update` segura os pings 500ms).
 * - Quando o usuário decide no `CookieBanner`, envia `consent update` refletindo
 *   `analytics` (analytics_storage) e `marketing` (ad_storage/ad_user_data/
 *   ad_personalization). Roda também no mount com a escolha já persistida.
 * - `page_view`: o `config` inicial manda o primeiro; este componente dispara os
 *   seguintes a cada navegação SPA (App Router).
 *
 * Só renderiza/roda se `NEXT_PUBLIC_GA_ID` estiver definido (senão é no-op —
 * previews sem env var não quebram). O `window.gtag` já existe antes da lib
 * carregar (shim de `dataLayer`), então as chamadas são enfileiradas com segurança.
 */
export function Analytics() {
  const { consent } = useConsent()
  const pathname = usePathname()
  const firstLoad = useRef(true)

  // Consent Mode: reflete a escolha atual (mount com valor persistido + mudanças).
  useEffect(() => {
    if (!GA_ID) return
    window.gtag?.('consent', 'update', {
      analytics_storage: consent.analytics ? 'granted' : 'denied',
      ad_storage: consent.marketing ? 'granted' : 'denied',
      ad_user_data: consent.marketing ? 'granted' : 'denied',
      ad_personalization: consent.marketing ? 'granted' : 'denied',
    })
  }, [consent.analytics, consent.marketing])

  // page_view nas navegações SPA (o `config` inicial já contabilizou a 1ª página).
  useEffect(() => {
    if (!GA_ID) return
    if (firstLoad.current) {
      firstLoad.current = false
      return
    }
    window.gtag?.('event', 'page_view', {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    })
  }, [pathname])

  if (!GA_ID) return null

  return (
    <>
      <Script id="ga-consent-default" strategy="beforeInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});`}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
    </>
  )
}
