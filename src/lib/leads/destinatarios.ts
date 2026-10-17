/**
 * Caixas das praças que recebem a notificação interna de proposta. São as mesmas que o formulário
 * antigo já usa (`submit-form.ts`, roteamento por cidade); aqui também por UF, para o formulário
 * de duas etapas, que conhece a UF desde a etapa 1 (spec 4.3).
 */
export const RECIFE_TO = 'ivan@semog.com.br'
export const PB_TO = 'comercial.pb@semog.com.br'
export const BELEM_TO = 'galvao@semog.com.br'
/**
 * Campina Grande (Leandro, 17/10/2026). Só quando a cidade é conhecida: a PB sem cidade (etapa 1
 * do formulário de duas etapas) continua em `PB_TO`, e "Outra cidade" não o inclui.
 */
export const CAMPINA_GRANDE_TO = 'marcello@semog.com.br'

/** UF sem Unidade: os três num e-mail só (cada um vê que os outros receberam). */
export const TODAS_AS_PRACAS: readonly string[] = [RECIFE_TO, BELEM_TO, PB_TO]

const POR_UF: Readonly<Record<string, readonly string[]>> = {
  PE: [RECIFE_TO],
  PB: [PB_TO],
  PA: [BELEM_TO],
}

/**
 * Destino pela UF e, na PB, pela cidade da etapa 2 (`CIDADES_DAS_UNIDADES`): é ela que separa
 * Campina Grande de João Pessoa, as duas Unidades do mesmo estado.
 */
export function destinatariosPorUf(uf: string | undefined, cidade?: string): readonly string[] {
  if (uf === 'PB' && cidade === 'Campina Grande') return [CAMPINA_GRANDE_TO]
  // hasOwn: a UF vem do cliente e "constructor" não pode achar chave herdada do objeto.
  return uf && Object.hasOwn(POR_UF, uf) ? POR_UF[uf] : TODAS_AS_PRACAS
}

/**
 * Contato do site, todos os assuntos: a caixa ola@, onde o Chatwoot distribui (Leandro,
 * 16/10/2026). Substitui a variável CONTACT_TO, que deixa de ser lida. Caixa compartilhada: o
 * e-mail do Contato não leva os botões de desfecho (Leandro, 17/10/2026; ver `submit-form.ts`).
 */
export const CONTATO_TO = 'ola@semog.com.br'

export function destinatariosDoContato(): readonly string[] {
  return [CONTATO_TO]
}
