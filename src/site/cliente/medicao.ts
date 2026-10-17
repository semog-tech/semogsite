import type { OrigemSouCliente } from './eventos'

/**
 * GA4: o painel "Sou cliente" abriu. Não é evento-chave (atendimento não é lead) e não leva dado
 * pessoal: só de onde abriu e a página. O clique de WhatsApp lá dentro é medido pelo
 * LeadClickTracker como `triagem_whatsapp_click`, pela marca `data-wa-caminho`.
 */
export function registrarSouClienteAberto(origem: OrigemSouCliente): void {
  window.gtag?.('event', 'sou_cliente_aberto', { origem, page_path: window.location.pathname })
}
