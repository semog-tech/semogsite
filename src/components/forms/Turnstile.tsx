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
          theme?: 'light' | 'dark' | 'auto'
          size?: 'normal' | 'compact'
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
  /**
   * Tema do widget. O default da Cloudflare é `auto`, que segue o
   * `prefers-color-scheme` do visitante — certo para as superfícies ESCURAS do
   * site, errado dentro de um card branco (quem estiver com o sistema no modo
   * escuro vê uma caixa preta no meio do formulário claro). Quem vive em
   * superfície clara passa `theme="light"`.
   */
  theme?: 'light' | 'dark' | 'auto'
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
export function Turnstile({ onToken, className, theme }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [scriptReady, setScriptReady] = useState(false)

  const renderWidget = useCallback(() => {
    if (!SITE_KEY || !containerRef.current || !window.turnstile || widgetIdRef.current) {
      return
    }

    // O widget "normal" da Cloudflare tem 300px FIXOS. Num contêiner mais
    // estreito que isso (card de formulário em tela de 320px, por exemplo) ele
    // vazaria para fora — e o `overflow-x: hidden` do body corta o que passar,
    // deixando parte do desafio inalcançável. `compact` (150px) é a variante
    // oficial para esse caso. Medido no mount: o widget não é re-renderizado a
    // cada resize, e o caso real é celular estreito, que não muda de largura.
    const espaco = containerRef.current.clientWidth
    const size = espaco > 0 && espaco < 300 ? 'compact' : undefined

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: (token) => onToken(token),
      ...(theme ? { theme } : {}),
      ...(size ? { size } : {}),
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
  }, [onToken, theme])

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
