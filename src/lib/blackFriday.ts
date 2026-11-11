/**
 * Campanha Black Friday 2026 (chamado #121): a primeira taxa de administração
 * só é cobrada em fevereiro de 2027, para os 10 primeiros condomínios que
 * fecharem contrato. Mesma oferta do e-mail marketing
 * (`public/email/black-friday-2026.html`), aqui voltada a condomínios novos.
 *
 * Módulo leve de propósito: o `LeadClickTracker` (componente de cliente) lê a
 * mensagem do WhatsApp daqui, e importar a landing inteira jogaria o conteúdo
 * dela no bundle de todas as páginas.
 */
export const BLACK_FRIDAY_SLUG = 'black-friday'

/** Vai no campo `mensagem` do lead (formulário) — é o que identifica a campanha no CRM. */
export const CAMPANHA_BLACK_FRIDAY = 'Black Friday 2026 — taxa de administração só em fev/2027'

/** Texto que já abre escrito na conversa do WhatsApp (ver `LeadClickTracker`). */
export const MENSAGEM_BLACK_FRIDAY =
  'Olá! Vim pela página de Black Friday da Semog e quero garantir uma das 10 vagas com a taxa de administração só em fevereiro de 2027.'
