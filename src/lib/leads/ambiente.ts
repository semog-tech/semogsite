/**
 * Preview e local gravam no MESMO `cms.leads` de produção (docs/DEPLOY.md, seção 4). Cada linha
 * nova grava de onde veio, e Exact, e-mail interno e Ads só processam produção ou linha antiga
 * (sem a chave). Sem isso o cron de produção mandaria ao CRM o teste de um Preview.
 */
export const AMBIENTE_FIELD = 'ambiente'

/** `VERCEL_ENV` (production | preview | development) ou `local` fora da Vercel. */
export function ambienteAtual(
  // Não `NodeJS.ProcessEnv`: os @types/node exigem `NODE_ENV` ali, e o teste passa só `VERCEL_ENV`.
  env: Readonly<Record<string, string | undefined>> = process.env,
): string {
  return env.VERCEL_ENV || 'local'
}

export function ambienteLiberaEnvio(data: Record<string, string>): boolean {
  const ambiente = data[AMBIENTE_FIELD]
  return ambiente === undefined || ambiente === 'production'
}

/** A mesma regra em SQL, para os crons. Linha antiga não tem a chave e vale como produção. */
export const SQL_AMBIENTE_LIBERADO = "coalesce(data->>'ambiente', 'production') = 'production'"
