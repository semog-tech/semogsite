'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import { useConsent } from '@/providers/ConsentProvider'

const CLARITY_ID = 'xr14d4ih79'

/**
 * Microsoft Clarity — heatmaps + gravações de sessão (análise qualitativa de
 * conversão da landing). Mesmo modelo de consent do `Analytics`/GA4: analytics
 * ligado por padrão (legítimo interesse, medição de 1ª parte), opt-out pelo
 * `CookieBanner`. `clarity('consent', granted)` espelha o `gtag('consent',…)`.
 *
 * O shim `window.clarity` é definido `beforeInteractive` (igual ao gtag), pra a
 * fila existir antes do `useEffect` de consent; a lib carrega `afterInteractive`
 * e processa a fila.
 *
 * ⚠️ Os domínios do Clarity (`*.clarity.ms`, `c.bing.com`) precisam estar
 * liberados no CSP do `next.config.ts` — sem isso o script é bloqueado igual o
 * gtag ficou (bug 23/07). O ID de projeto do Clarity é público (vai no HTML).
 */
export function Clarity() {
  const { consent, decided } = useConsent()

  // Antes de decidir: analytics ligado (legítimo interesse). Depois: respeita a
  // escolha do usuário — em opt-out, sinaliza `consent(false)` e o Clarity para.
  useEffect(() => {
    const analyticsGranted = !decided || consent.analytics
    window.clarity?.('consent', analyticsGranted)
  }, [decided, consent.analytics])

  return (
    <>
      <Script id="ms-clarity-init" strategy="beforeInteractive">
        {`window.clarity=window.clarity||function(){(window.clarity.q=window.clarity.q||[]).push(arguments)};`}
      </Script>
      <Script id="ms-clarity" strategy="afterInteractive">
        {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
      </Script>
    </>
  )
}
