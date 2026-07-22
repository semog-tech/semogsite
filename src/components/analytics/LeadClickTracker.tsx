'use client'

import { useEffect } from 'react'

/** Seção da página onde o link foi clicado (best-effort, pra segmentar no GA4). */
function sectionOf(anchor: Element): string {
  if (anchor.closest('.wa-float')) return 'botao_flutuante'
  if (anchor.closest('header')) return 'cabecalho'
  if (anchor.closest('footer')) return 'rodape'
  return 'conteudo'
}

/**
 * Rastreia cliques nos canais de lead que **não** passam pelo formulário —
 * links de WhatsApp (`wa.me`/`whatsapp`) e de telefone (`tel:`) — que hoje
 * são invisíveis pro GA4/Ads. Usa **um listener delegado** no documento
 * (fase de captura), então pega qualquer link: botão flutuante, header,
 * footer, blocos e páginas, sem precisar tocar em cada componente.
 *
 * Dispara os eventos GA4 `whatsapp_click` / `phone_click` com
 * `transport_type: 'beacon'` (entrega garantida mesmo se a página navegar).
 * Respeita o Consent Mode: `window.gtag` só existe com consentimento de
 * analytics — sem ele, é no-op. Renderiza `null`.
 */
export function LeadClickTracker() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const el = event.target as Element | null
      const anchor = el?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor) return

      const href = anchor.getAttribute('href') ?? ''
      let name: 'whatsapp_click' | 'phone_click' | null = null
      if (/(?:wa\.me|whatsapp)/i.test(href)) name = 'whatsapp_click'
      else if (/^tel:/i.test(href)) name = 'phone_click'
      if (!name) return

      window.gtag?.('event', name, {
        link_url: href,
        link_section: sectionOf(anchor),
        page_path: window.location.pathname,
        transport_type: 'beacon',
      })
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return null
}
