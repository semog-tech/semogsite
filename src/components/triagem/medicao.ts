/**
 * Eventos GA4 da triagem do WhatsApp. Nenhum leva dado pessoal: só a página e o
 * caminho escolhido. Passam pelo `window.gtag` como os demais do site, então o
 * Consent Mode decide o que sai (ver `Analytics`).
 *
 * O clique nos links de WhatsApp da triagem NÃO é registrado aqui: ele já vira
 * `whatsapp_click` pelo `LeadClickTracker`, com a seção do caminho.
 */

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
  window.gtag?.('event', 'generate_lead', {
    form: 'proposta',
    variante: 'contato_rapido',
    currency: 'BRL',
    value: 1,
  })
}
