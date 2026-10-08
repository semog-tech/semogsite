/**
 * Eventos GA4 da triagem do WhatsApp. Nenhum leva dado pessoal: só a página, o
 * caminho escolhido e, na 2ª via, classes (etapa, motivo, uma/várias, vencida).
 * Nunca CPF, unidade, condomínio, valor, código, referência ou URL. Passam pelo
 * `window.gtag` como os demais do site, então o Consent Mode decide o que sai
 * (ver `Analytics`).
 *
 * O clique nos links de WhatsApp da triagem NÃO é registrado aqui: ele já vira
 * `triagem_whatsapp_click` (e não `whatsapp_click`, que é evento-chave de lead)
 * pelo `LeadClickTracker`, com a seção do caminho.
 */

import { registrarLeadGerado } from '@/lib/medicaoLead'
import type { TelaSegundaVia } from './segunda-via/estado'

/** O que a pessoa escolheu no menu — `portal` é o atalho para a área do cliente. */
export type CaminhoEscolhido = 'cliente' | 'proposta' | 'outro' | 'portal'

export function registrarTriagemAberta() {
  window.gtag?.('event', 'triagem_aberta', { page_path: window.location.pathname })
}

export function registrarCaminho(caminho: CaminhoEscolhido) {
  window.gtag?.('event', 'triagem_caminho', { caminho })
}

/**
 * Conversão da proposta curta: o MESMO `generate_lead` do formulário completo,
 * com a variante ao lado, para não abrir uma série nova de conversão.
 */
export function registrarPropostaEnviada() {
  registrarLeadGerado('proposta', { variante: 'contato_rapido' })
}

/** Marcos da 2ª via sem parâmetro: pedido aceito, unidade sem boleto, cobranças restritas. */
export function registrarSegundaVia(evento: 'solicitada' | 'sem_boleto' | 'restrita') {
  window.gtag?.('event', `segunda_via_${evento}`)
}

export function registrarCodigoValidado(unidades: 'uma' | 'varias') {
  window.gtag?.('event', 'segunda_via_codigo_validado', { unidades })
}

/** Clique em "Abrir boleto". A URL é credencial e não vai junto. */
export function registrarBoletoAberto(vencida: boolean) {
  window.gtag?.('event', 'segunda_via_boleto_aberto', { vencida })
}

export type MotivoDaFalha =
  | 'limite'
  | 'expirado'
  | 'bloqueado'
  | 'indisponivel'
  | 'sessao'
  | 'sem_unidade'

export function registrarFalhaSegundaVia(etapa: TelaSegundaVia, motivo: MotivoDaFalha) {
  window.gtag?.('event', 'segunda_via_falhou', { etapa, motivo })
}
