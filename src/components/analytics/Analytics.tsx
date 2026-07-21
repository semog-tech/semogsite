'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import { useConsent } from '@/providers/ConsentProvider'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

/**
 * GA4 (gtag.js) com **Google Consent Mode v2**, no modelo "legítimo interesse
 * para analytics" (o site só faz medição de 1ª parte, sem cookies de anúncio):
 * - `analytics_storage` liga **por padrão** (antes mesmo da escolha), com
 *   opt-out pelo `CookieBanner`.
 * - `ad_storage`/`ad_user_data`/`ad_personalization` ficam **sempre negados por
 *   padrão** e só ligam se o usuário optar por marketing (que hoje não é usado).
 *
 * `page_view` fica por conta do próprio GA4: o `config` manda o da carga inicial
 * e o **Enhanced Measurement** do fluxo Web cobre as navegações SPA (history
 * events do App Router) — por isso NÃO enviamos `page_view` manual (evita
 * duplicação). No-op sem `NEXT_PUBLIC_GA_ID`.
 */
export function Analytics() {
  const { consent, decided } = useConsent()

  useEffect(() => {
    if (!GA_ID) return
    // Antes de decidir: analytics ligado (legítimo interesse). Depois: respeita
    // a escolha do usuário. Marketing sempre segue a escolha (default negado).
    const analyticsGranted = !decided || consent.analytics
    window.gtag?.('consent', 'update', {
      analytics_storage: analyticsGranted ? 'granted' : 'denied',
      ad_storage: consent.marketing ? 'granted' : 'denied',
      ad_user_data: consent.marketing ? 'granted' : 'denied',
      ad_personalization: consent.marketing ? 'granted' : 'denied',
    })
  }, [decided, consent.analytics, consent.marketing])

  if (!GA_ID) return null

  return (
    <>
      <Script id="ga-consent-default" strategy="beforeInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});`}
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
