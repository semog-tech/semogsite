import { site } from '@/../content/site'

/**
 * Triagem do botão flutuante de WhatsApp: os caminhos, as mensagens que cada
 * um leva pronta para a conversa e a seção com que o clique é medido. Tudo num
 * lugar só, porque três pontas precisam concordar sobre os mesmos nomes — a
 * tela (`TriagemWhatsApp`), o rastreador (`LeadClickTracker`) e o servidor (o
 * beacon `/api/track/whatsapp` e o cron do Google Ads).
 *
 * Desenho completo em
 * `docs/superpowers/specs/2026-10-06-triagem-whatsapp-e-segunda-via-design.md`.
 */

/**
 * Atributo que marca um link de WhatsApp como saído da triagem. Com ele, o
 * `LeadClickTracker` mede o clique pelo caminho e **não** reescreve a mensagem
 * — sem isso, o protocolo da proposta e o "Sou cliente" virariam o texto
 * genérico de captação no momento do clique.
 */
export const ATRIBUTO_CAMINHO = 'data-wa-caminho'

/**
 * Seção gravada em `cms.whatsapp_clicks.section` (e enviada ao GA4 como
 * `link_section`) para cada caminho. `restrita` só nasce na fase 2 (cobranças
 * que precisam da equipe), mas já é aceita pelo beacon e já fica fora do Ads.
 */
export const SECAO_POR_CAMINHO = {
  cliente: 'triagem_cliente',
  proposta: 'triagem_proposta',
  outro: 'triagem_outro',
  restrita: 'triagem_restrita',
} as const

export type CaminhoDoWhatsApp = keyof typeof SECAO_POR_CAMINHO

/** A seção de um caminho lido do DOM, ou `undefined` se o valor for estranho. */
export function secaoDoCaminho(caminho: string | undefined): string | undefined {
  if (!caminho || !Object.hasOwn(SECAO_POR_CAMINHO, caminho)) return undefined
  return SECAO_POR_CAMINHO[caminho as CaminhoDoWhatsApp] // `hasOwn` acima garante a chave
}

/**
 * Seções cujo clique **não** sobe como conversão de WhatsApp no Google Ads.
 * `cliente` e `restrita` são atendimento a quem já é cliente; contar isso
 * ensinaria o lance automático a comprar clique de condômino. `proposta` é o
 * clique que vem DEPOIS de o lead já ter sido gravado pelo formulário, que
 * conta pela ação própria — contar de novo seria duplicar a conversão.
 */
export const SECOES_FORA_DO_ADS: readonly string[] = [
  SECAO_POR_CAMINHO.cliente,
  SECAO_POR_CAMINHO.restrita,
  SECAO_POR_CAMINHO.proposta,
]

/**
 * Mensagens prontas. Só palavras, sem número: o filtro do bot do WhatsApp
 * desvia mensagem com dígitos. A única exceção é o protocolo da proposta, que
 * é o que liga a conversa ao lead já gravado.
 */
export const MENSAGEM_DO_CLIENTE = 'Olá! Sou cliente e quero a segunda via do boleto.'
export const MENSAGEM_DE_OUTRO_ASSUNTO = 'Olá! Vim pelo site e tenho outra dúvida.'

export function mensagemDaProposta(protocolo: string): string {
  return `Olá! Acabei de pedir uma proposta pelo site. Protocolo ${protocolo}.`
}

/** Link do WhatsApp central (`content/site.ts`), com a mensagem já escrita. */
export function linkWhatsApp(mensagem: string): string {
  return `https://wa.me/${site.company.whatsapp}?text=${encodeURIComponent(mensagem)}`
}

/** Área do cliente da Superlógica — mesmo endereço do cabeçalho. */
export const LINK_AREA_DO_CLIENTE = site.header.clientArea.href
