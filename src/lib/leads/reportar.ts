import * as Sentry from '@sentry/nextjs'

export type PassoDoLead = 'gravacao' | 'exact' | 'email' | 'ads' | 'pos_gravacao' | 'cron'
export type ContextoDaFalha = { origem: string; leadId?: string }

/**
 * Falha no caminho do lead → log + Sentry do servidor (spec 4.2; hoje nenhum caminho de servidor
 * chamava o Sentry, porque a action engole tudo). **Sem dado pessoal no evento:** só passo, origem,
 * id da linha e o nome da classe do erro. A mensagem original NÃO vai ao Sentry (erro de Exact,
 * SendGrid ou Postgres pode ecoar telefone, e-mail ou nome); ela fica só no log do servidor e, para
 * o Exact, em `exact_error`.
 */
export function reportarFalhaDoLead(
  passo: PassoDoLead,
  erro: unknown,
  contexto: ContextoDaFalha,
): void {
  console.error(`[lead] ${contexto.origem}: falha em ${passo}`, erro)
  const tipo = erro instanceof Error ? erro.name : typeof erro
  Sentry.captureException(new Error(`Falha em ${passo} (${tipo})`), {
    tags: { fluxo: 'lead', passo, origem: contexto.origem },
    extra: contexto.leadId ? { leadId: contexto.leadId } : {},
  })
}
