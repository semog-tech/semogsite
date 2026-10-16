/**
 * Preview e local gravam no MESMO `cms.leads` de produção (docs/DEPLOY.md, seção 4). Cada linha
 * nova grava de onde veio, e Exact, e-mail interno e Ads só processam produção ou linha antiga
 * (sem a chave). Sem isso o cron de produção mandaria ao CRM o teste de um Preview.
 */
export const AMBIENTE_FIELD = 'ambiente'

/**
 * `VERCEL_ENV` (production | preview | development); sem ele, `production` se `VERCEL` existir;
 * senão `local`. **Na dúvida, falha para o lado de enviar:** se a Vercel deixar de expor
 * `VERCEL_ENV` (variáveis de sistema desligadas no projeto), cair em `local` faria o site de
 * produção gravar o lead sem mandá-lo ao Exact nem ao e-mail, e a captação ficaria muda sem erro
 * nenhum, como no formulário mudo de 21/08 a 01/09/2026. Lead de teste no CRM custa menos que lead
 * perdido.
 */
export function ambienteAtual(
  // Não `NodeJS.ProcessEnv`: os @types/node exigem `NODE_ENV` ali, e o teste passa só `VERCEL_ENV`.
  env: Readonly<Record<string, string | undefined>> = process.env,
): string {
  if (env.VERCEL_ENV) return env.VERCEL_ENV
  return env.VERCEL ? 'production' : 'local'
}

export function ambienteLiberaEnvio(data: Record<string, string>): boolean {
  const ambiente = data[AMBIENTE_FIELD]
  return ambiente === undefined || ambiente === 'production'
}

/** A mesma regra em SQL, para os crons. Linha antiga não tem a chave e vale como produção. */
export const SQL_AMBIENTE_LIBERADO = "coalesce(data->>'ambiente', 'production') = 'production'"
