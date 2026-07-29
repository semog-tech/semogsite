'use client'

import { useEffect } from 'react'
import { useConsent } from '@/providers/ConsentProvider'

/** Seção da página onde o link foi clicado (best-effort, pra segmentar no GA4). */
function sectionOf(anchor: Element): string {
  if (anchor.closest('.wa-float')) return 'botao_flutuante'
  if (anchor.closest('header')) return 'cabecalho'
  if (anchor.closest('footer')) return 'rodape'
  return 'conteudo'
}

/**
 * Cidade legível a partir do slug da landing, pra montar a mensagem
 * pré-preenchida do WhatsApp. Os slugs são os de `src/data/cityLandings.ts` —
 * repetidos aqui de propósito: aquele módulo carrega o conteúdo inteiro das
 * landings (depoimentos, FAQs) e este é um componente de cliente, então
 * importá-lo jogaria tudo isso no bundle. Cidade nova sem entrada aqui não
 * quebra nada — cai na mensagem genérica.
 */
const CIDADE_POR_SLUG: Record<string, string> = {
  'administradora-de-condominios-recife': 'Recife',
  'administradora-de-condominios-joao-pessoa': 'João Pessoa',
  'administradora-de-condominios-campina-grande': 'Campina Grande',
  'administradora-de-condominios-belem': 'Belém',
}

/**
 * Mensagem que já vai escrita na conversa. Sem ela, quem atende recebe um "oi"
 * sem contexto nenhum — não sabe a cidade nem que a pessoa veio do site.
 */
export function mensagemWhatsApp(pathname: string): string {
  const cidade = CIDADE_POR_SLUG[pathname.replace(/^\/+|\/+$/g, '')]
  const fim = cidade ? ` do meu condomínio em ${cidade}.` : ' do meu condomínio.'
  return `Olá! Vim pelo site da Semog e gostaria de falar sobre a administração${fim}`
}

/**
 * Rastreia cliques nos canais de lead que **não** passam pelo formulário —
 * links de WhatsApp (`wa.me`/`whatsapp`) e de telefone (`tel:`) — que hoje
 * são invisíveis pro GA4/Ads. Usa **um listener delegado** no documento
 * (fase de captura), então pega qualquer link: botão flutuante, header,
 * footer, blocos e páginas, sem precisar tocar em cada componente.
 *
 * Faz três coisas no clique de WhatsApp:
 *
 * 1. **Evento GA4** `whatsapp_click` / `phone_click` com `transport_type:
 *    'beacon'` (entrega garantida mesmo se a página navegar).
 * 2. **Mensagem pré-preenchida** com a cidade da landing, reescrevendo o
 *    `href` no momento do clique — é o único momento em que dá pra saber a
 *    página atual, já que o botão flutuante é global e sobrevive à navegação
 *    SPA. Sempre sobrescreve (nunca fica com o texto de uma página anterior).
 * 3. **Beacon server-side** pra `/api/track/whatsapp`, que grava o clique com
 *    o `gclid` lido do cookie de 1ª parte. É isso que torna o WhatsApp
 *    visível no Google Ads: medido em 29/07/2026, o canal responde por ~3x o
 *    volume do formulário (14 `whatsapp_click` × 5 `generate_lead`; no pago,
 *    7 × 1), mas como só existia como evento de navegador, sumia com
 *    ad-blocker e nunca virava conversão.
 *
 * Respeita o Consent Mode: o evento GA4 depende de `window.gtag` (que só
 * existe com consentimento) e o beacon só dispara com analytics permitido —
 * mesma base legal do cookie de atribuição que ele lê. Renderiza `null`.
 */
export function LeadClickTracker() {
  const { consent, decided } = useConsent()
  // Antes de decidir: analytics ligado (legítimo interesse), igual ao `Analytics`.
  const analyticsGranted = !decided || consent.analytics

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

      const section = sectionOf(anchor)
      const page = window.location.pathname

      window.gtag?.('event', name, {
        link_url: href,
        link_section: section,
        page_path: page,
        transport_type: 'beacon',
      })

      if (name !== 'whatsapp_click') return

      // Reescreve o href antes da navegação (listener é de captura, roda antes
      // da ação padrão do link).
      try {
        const url = new URL(anchor.href)
        url.searchParams.set('text', mensagemWhatsApp(page))
        anchor.href = url.toString()
      } catch {
        // href exótico: segue sem mensagem, o clique não pode quebrar
      }

      if (!analyticsGranted) return
      navigator.sendBeacon?.(
        '/api/track/whatsapp',
        new Blob([JSON.stringify({ page, section })], { type: 'application/json' }),
      )
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [analyticsGranted])

  return null
}
