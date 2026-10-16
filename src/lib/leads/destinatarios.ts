/**
 * Caixas das praças que recebem a notificação interna de proposta. São as mesmas que o formulário
 * antigo já usa (`submit-form.ts`, roteamento por cidade); aqui também por UF, para o formulário
 * de duas etapas, que conhece a UF desde a etapa 1 (spec 4.3).
 */
export const RECIFE_TO = 'ivan@semog.com.br'
export const PB_TO = 'comercial.pb@semog.com.br'
export const BELEM_TO = 'galvao@semog.com.br'

/** UF sem Unidade: os três num e-mail só (cada um vê que os outros receberam). */
export const TODAS_AS_PRACAS: readonly string[] = [RECIFE_TO, BELEM_TO, PB_TO]

const POR_UF: Readonly<Record<string, readonly string[]>> = {
  PE: [RECIFE_TO],
  PB: [PB_TO],
  PA: [BELEM_TO],
}

export function destinatariosPorUf(uf: string | undefined): readonly string[] {
  // hasOwn: a UF vem do cliente e "constructor" não pode achar chave herdada do objeto.
  return uf && Object.hasOwn(POR_UF, uf) ? POR_UF[uf] : TODAS_AS_PRACAS
}
