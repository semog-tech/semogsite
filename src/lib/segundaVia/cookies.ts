import 'server-only'
import { cookies } from 'next/headers'
import { refValida } from './formatos'

/**
 * Cookies da 2ª via: o `desafio` (entre pedir e confirmar o código) e a
 * `sessao` (depois do código). `HttpOnly`, então o JavaScript da página nunca
 * vê os tokens; `SameSite=Strict`; `Secure` fora do `next dev`. Os prazos são
 * os do app (10 e 15 min) e não se renovam com o uso.
 *
 * Só funciona dentro de Server Action ou Route Handler (o Next recusa `set`
 * e `delete` durante a renderização).
 */

const DESAFIO = 'segvia_desafio'
const SESSAO = 'segvia_sessao'
const PRAZO_DESAFIO_S = 600
const PRAZO_SESSAO_S = 900

type Loja = Awaited<ReturnType<typeof cookies>>

function atributos(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    path: '/',
    maxAge,
  } as const
}

/** Apaga com os mesmos atributos da gravação, para o navegador casar o cookie. */
function apagar(loja: Loja, nome: string): void {
  const { maxAge: _, ...resto } = atributos(0)
  loja.delete({ name: nome, ...resto })
}

/** Valor com o formato de referência opaca, ou `null`. Valor adulterado é apagado. */
async function ler(nome: string): Promise<string | null> {
  const loja = await cookies()
  const valor = loja.get(nome)?.value
  if (valor === undefined) return null
  if (refValida(valor)) return valor
  apagar(loja, nome)
  return null
}

export function lerDesafio(): Promise<string | null> {
  return ler(DESAFIO)
}

export function lerSessao(): Promise<string | null> {
  return ler(SESSAO)
}

/** Grava (ou renova, no reenvio) o desafio com prazo cheio de 10 min. */
export async function gravarDesafio(desafio: string): Promise<void> {
  const loja = await cookies()
  loja.set(DESAFIO, desafio, atributos(PRAZO_DESAFIO_S))
}

/**
 * Código confirmado: o desafio foi consumido no app, a sessão o substitui. O
 * cookie nunca dura mais que a sessão do app (o menor dos dois prazos).
 */
export async function trocarDesafioPorSessao(
  sessao: string,
  expiraEmSegundos: number,
): Promise<void> {
  const loja = await cookies()
  apagar(loja, DESAFIO)
  loja.set(SESSAO, sessao, atributos(Math.min(PRAZO_SESSAO_S, expiraEmSegundos)))
}

export async function apagarDesafio(): Promise<void> {
  const loja = await cookies()
  apagar(loja, DESAFIO)
}

export async function apagarCookiesSegundaVia(): Promise<void> {
  const loja = await cookies()
  apagar(loja, DESAFIO)
  apagar(loja, SESSAO)
}
