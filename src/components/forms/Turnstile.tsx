'use client'

import Script from 'next/script'
import { useCallback, useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          'error-callback'?: () => void
          'expired-callback'?: () => void
        },
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export type TurnstileProps = {
  /** Chamado com o token assim que o desafio passa (challenge geralmente é invisível). */
  onToken: (token: string) => void
  className?: string
}

/**
 * Widget client do Cloudflare Turnstile — protege formulários contra bots
 * sem exigir um CAPTCHA visível tradicional (o desafio "managed" fica
 * invisível na maioria dos casos, só cai pra interativo se a Cloudflare
 * suspeitar de tráfego automatizado). Não anima nada por conta própria além
 * do que a Cloudflare renderiza dentro do iframe — não há motion nosso pra
 * respeitar `prefers-reduced-motion` aqui, o widget em si já é leve.
 *
 * Usa a API imperativa `window.turnstile.render(...)` (em vez do padrão
 * declarativo `data-callback` em `window`) pra manter o callback como uma
 * prop React normal, sem poluir o escopo global.
 */
export function Turnstile({ onToken, className }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [scriptReady, setScriptReady] = useState(false)

  const renderWidget = useCallback(() => {
    if (!SITE_KEY || !containerRef.current || !window.turnstile || widgetIdRef.current) {
      return
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: (token) => onToken(token),
      'error-callback': () => {
        if (widgetIdRef.current) {
          window.turnstile?.reset(widgetIdRef.current)
        }
      },
      'expired-callback': () => {
        if (widgetIdRef.current) {
          window.turnstile?.reset(widgetIdRef.current)
        }
      },
    })
  }, [onToken])

  // O script da Cloudflare pode já estar carregado (ex.: outra instância do
  // widget montada antes nessa navegação client-side) — nesse caso o evento
  // `onLoad` do <Script> não dispara de novo, então checamos direto.
  useEffect(() => {
    if (window.turnstile) {
      setScriptReady(true)
    }
  }, [])

  useEffect(() => {
    if (scriptReady) {
      renderWidget()
    }
  }, [scriptReady, renderWidget])

  useEffect(() => {
    return () => {
      if (widgetIdRef.current) {
        window.turnstile?.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [])

  if (!SITE_KEY) {
    console.error('[turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY ausente — widget não renderizado')
    return null
  }

  return (
    <>
      <Script src={SCRIPT_SRC} strategy="afterInteractive" onLoad={() => setScriptReady(true)} />
      <div ref={containerRef} className={className} />
    </>
  )
}
