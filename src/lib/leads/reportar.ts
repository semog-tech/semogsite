import * as Sentry from '@sentry/nextjs'

export type PassoDoLead =
  | 'gravacao'
  | 'exact'
  | 'email'
  | 'ads'
  | 'pos_gravacao'
  | 'cron'
  | 'cron_atrasado'
  | 'cookie'
/** `idadeMin`: só no aviso de etapa 1 reivindicada tarde (cron parado); não é dado pessoal. */
export type ContextoDaFalha = { origem: string; leadId?: string; idadeMin?: number }

/**
 * Classe do erro e, se houver, o `code` do pg (ex.: `Error, 23505`). Nunca a mensagem: ela pode
 * ecoar telefone, e-mail ou nome. Serve ao log e ao corpo da resposta 500 dos crons.
 */
export function descreverErro(erro: unknown): string {
  const tipo = erro instanceof Error ? erro.name : typeof erro
  const codigo =
    erro instanceof Error && 'code' in erro && typeof erro.code === 'string' ? erro.code : undefined
  return codigo ? `${tipo}, ${codigo}` : tipo
}

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
  console.error(`[lead] ${contexto.origem}: falha em ${passo} (${descreverErro(erro)})`)
  Sentry.captureException(new Error(`Falha em ${passo} (${tipo})`), {
    tags: { fluxo: 'lead', passo, origem: contexto.origem },
    extra: {
      ...(contexto.leadId ? { leadId: contexto.leadId } : {}),
      ...(contexto.idadeMin !== undefined ? { idadeMin: contexto.idadeMin } : {}),
    },
  })
}
