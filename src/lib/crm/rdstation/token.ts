import 'server-only'
import { query } from '@/lib/db'

/**
 * Fachada privada do site (migração do site), que chama a função de commercial
 * mantida pelo semogapp, sem conceder USAGE commercial ao runtime: cms.crm_rdstation_token_obter()
 * RETURNS TABLE(access_token text, expires_at timestamptz), somente leitura,
 * SECURITY DEFINER; o site chama pelo pool como cms_user. Nunca lê refresh_token
 * nem renova OAuth. Sem cache: cada tentativa lê a versão mantida pelo app.
 * Zero/mais de uma linha, token vazio ou validade <60s são erros, não no-op.
 */
export async function obterTokenRd(): Promise<string> {
  const { rows } = await query<{ access_token: string | null; expires_at: Date | string | null }>(
    'select access_token, expires_at from cms.crm_rdstation_token_obter()',
  )
  const token = rows[0]
  if (rows.length !== 1 || !token?.access_token?.trim() || !token.expires_at) {
    throw new Error('RD Station: token ausente ou contrato de leitura inválido')
  }
  const validade = new Date(token.expires_at).getTime()
  if (!Number.isFinite(validade) || validade <= Date.now() + 60_000) {
    throw new Error('RD Station: token expirado ou com menos de 60s de validade')
  }
  return token.access_token
}
