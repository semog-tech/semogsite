import * as Sentry from '@sentry/nextjs'

export type PassoDoLead = 'gravacao' | 'exact' | 'email' | 'ads' | 'pos_gravacao' | 'cron'
export type ContextoDaFalha = { origem: string; leadId?: string }

/**
 * Falha no caminho do lead → log + Sentry do servidor (spec 4.2; hoje nenhum caminho de servidor
 * chamava o Sentry, porque a action engole tudo). **Sem dado pessoal no evento:** só passo, origem,
 * id da linha e o nome da classe do erro. A mensagem original NÃO vai ao Sentry (erro de Exact,
 * SendGrid ou Postgres pode ecoar telefone, e-mail ou nome); para o Exact, o detalhe fica em
 * `exact_error`. Nem o log do servidor leva o erro cru (ver o comentário no corpo).
 */
export function reportarFalhaDoLead(
  passo: PassoDoLead,
  erro: unknown,
  contexto: ContextoDaFalha,
): void {
  const tipo = erro instanceof Error ? erro.name : typeof erro
  // O erro cru NÃO vai ao console: a integração de console do Sentry o transformaria em breadcrumb
  // (texto + propriedades, como o `detail` do Postgres) e ele iria em todo evento seguinte da
  // requisição. Loga-se só o que não é pessoal; `code` (ex.: 23505) identifica o erro do pg.
  const codigo =
    erro instanceof Error && 'code' in erro && typeof erro.code === 'string' ? erro.code : undefined
  console.error(
    `[lead] ${contexto.origem}: falha em ${passo} (${tipo}${codigo ? `, ${codigo}` : ''})`,
  )
  Sentry.captureException(new Error(`Falha em ${passo} (${tipo})`), {
    tags: { fluxo: 'lead', passo, origem: contexto.origem },
    extra: contexto.leadId ? { leadId: contexto.leadId } : {},
  })
}
