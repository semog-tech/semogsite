import 'server-only'
import { cookies } from 'next/headers'

/**
 * Cookie do token da etapa (R4), no padrão dos cookies da 2ª via (`segundaVia/cookies.ts`):
 * HttpOnly, SameSite=Strict, Secure fora do `next dev`. O valor é o uuid de `token_envio`, nunca o
 * id da linha. **Validade (30 min) e uso único vêm do banco**, no WHERE do UPDATE; o prazo do cookie
 * (2 h) só serve para, com um Turnstile novo, reaproveitar a linha de quem voltou depois (DP3).
 * Só funciona em Server Action ou Route Handler.
 */
export const NOME_DO_COOKIE = 'proposta_etapa'
const PRAZO_S = 7200
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

function atributos(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    path: '/',
    maxAge,
  } as const
}

async function apagar(): Promise<void> {
  const loja = await cookies()
  const { maxAge: _, ...resto } = atributos(0)
  loja.delete({ name: NOME_DO_COOKIE, ...resto })
}

/** O token, se tiver formato de uuid; valor adulterado é apagado e vale como ausente. */
export async function lerTokenDaEtapa(): Promise<string | null> {
  const valor = (await cookies()).get(NOME_DO_COOKIE)?.value
  if (valor === undefined) return null
  if (UUID.test(valor)) return valor
  await apagar()
  return null
}

export async function gravarTokenDaEtapa(token: string): Promise<void> {
  const loja = await cookies()
  loja.set(NOME_DO_COOKIE, token, atributos(PRAZO_S))
}

export async function apagarTokenDaEtapa(): Promise<void> {
  await apagar()
}
