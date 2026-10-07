'use server'

/**
 * Server Actions da 2ª via de boleto: assinam e chamam a API pública do
 * semogapp (`@/lib/segundaVia/cliente`) e guardam `desafio`/`sessao` em
 * cookies HttpOnly (`@/lib/segundaVia/cookies`). O navegador nunca recebe
 * esses tokens, o CPF de volta nem nada além do link do boleto pedido.
 *
 * **Só exporte função async deste arquivo.** Tipos ficam em
 * `@/lib/segundaVia/tipos` (ver `scripts/check-use-server-exports.mjs`).
 *
 * Os argumentos chegam do navegador sem garantia de tipo: toda entrada é
 * conferida aqui antes de gastar uma chamada ao app.
 */

import { isIP } from 'node:net'
import { clienteIp } from '@/lib/clienteIp'
import { cpfValido, somenteDigitos } from '@/lib/cpf'
import { rateLimit } from '@/lib/rate-limit'
import { chamarSegundaVia } from '@/lib/segundaVia/cliente'
import {
  apagarCookiesSegundaVia,
  apagarDesafio,
  gravarDesafio,
  lerDesafio,
  lerSessao,
  trocarDesafioPorSessao,
} from '@/lib/segundaVia/cookies'
import { normalizarCodigo, refValida } from '@/lib/segundaVia/formatos'
import type {
  Desligada,
  ResultadoCobrancas,
  ResultadoConfirmar,
  ResultadoLink,
  ResultadoReenviar,
  ResultadoSolicitar,
} from '@/lib/segundaVia/tipos'
import { verifyTurnstile } from '@/lib/turnstile'

const DESLIGADA: Desligada = { tipo: 'desligada' }

/**
 * Valor de `ipCliente` quando o `x-forwarded-for` falta ou não é um IP (ex.:
 * `next dev` sem proxy). É o mesmo fallback do rate limit do site: todos os
 * visitantes sem IP legível dividem um balde só, no site e no app.
 */
const IP_DESCONHECIDO = 'anon'

function desligada(): boolean {
  return process.env.SEGUNDA_VIA_ATIVA !== 'true'
}

/** IP do cliente só se tiver formato de IPv4/IPv6; o header não é confiável por si. */
async function ipValido(): Promise<string | undefined> {
  const ip = await clienteIp()
  return ip !== undefined && isIP(ip) !== 0 ? ip : undefined
}

async function ipCliente(): Promise<string> {
  return (await ipValido()) ?? IP_DESCONHECIDO
}

export async function solicitarCodigo(
  cpf: string,
  turnstileToken: string,
): Promise<ResultadoSolicitar> {
  if (desligada()) return DESLIGADA
  if (typeof cpf !== 'string' || !cpfValido(cpf)) return { tipo: 'entrada_invalida' }

  const ip = await ipValido()
  // Primeira barreira só (memória por instância); os limites que valem estão no app.
  const rate = rateLimit(`segunda-via:${ip ?? IP_DESCONHECIDO}`, { max: 5, windowMs: 60_000 })
  if (!rate.ok) return { tipo: 'limite', tentarEmSegundos: rate.retryAfter ?? 60 }

  if (typeof turnstileToken !== 'string' || turnstileToken === '') return { tipo: 'anti_robo' }
  if (!(await verifyTurnstile(turnstileToken, ip))) return { tipo: 'anti_robo' }

  const r = await chamarSegundaVia('solicitar', {
    cpf: somenteDigitos(cpf),
    ipCliente: ip ?? IP_DESCONHECIDO,
  })
  if (r.tipo !== 'ok') return r
  await gravarDesafio(r.desafio)
  return { tipo: 'ok', reenvioEmSegundos: r.reenvioEmSegundos }
}

export async function reenviarCodigo(): Promise<ResultadoReenviar> {
  if (desligada()) return DESLIGADA
  const desafio = await lerDesafio()
  // Sem cookie (passaram os 10 min), o desafio já expirou para o app também.
  if (!desafio) return { tipo: 'expirado' }

  const r = await chamarSegundaVia('reenviar', { desafio, ipCliente: await ipCliente() })
  // O código novo vale 10 min a partir de agora: o cookie acompanha.
  if (r.tipo === 'ok') await gravarDesafio(desafio)
  if (r.tipo === 'expirado') await apagarDesafio()
  return r
}

export async function confirmarCodigo(codigo: string): Promise<ResultadoConfirmar> {
  if (desligada()) return DESLIGADA
  const normalizado = typeof codigo === 'string' ? normalizarCodigo(codigo) : null
  if (!normalizado) return { tipo: 'formato' }
  const desafio = await lerDesafio()
  if (!desafio) return { tipo: 'expirado' }

  const r = await chamarSegundaVia('confirmar', {
    desafio,
    codigo: normalizado,
    ipCliente: await ipCliente(),
  })
  if (r.tipo !== 'ok') return r
  await trocarDesafioPorSessao(r.sessao, r.expiraEmSegundos)
  return { tipo: 'ok', unidades: r.unidades }
}

/**
 * Sessão perdida (cookie ausente, ou o app não a reconhece) ou referência que
 * não é desta sessão: o redutor das telas leva a "consulta expirou" e a
 * pessoa recomeça, então os cookies saem junto.
 */
async function aposConsulta<T extends ResultadoCobrancas | ResultadoLink>(r: T): Promise<T> {
  if (r.tipo === 'sessao_invalida' || r.tipo === 'referencia_invalida') {
    await apagarCookiesSegundaVia()
  }
  return r
}

export async function listarCobrancas(unidade: string): Promise<ResultadoCobrancas> {
  if (desligada()) return DESLIGADA
  if (!refValida(unidade, 'referencia')) return aposConsulta({ tipo: 'referencia_invalida' })
  const sessao = await lerSessao()
  // Review Focus 4: sem cookie, nunca `indisponivel`.
  if (!sessao) return aposConsulta({ tipo: 'sessao_invalida' })

  const r = await chamarSegundaVia('cobrancas', { sessao, unidade, ipCliente: await ipCliente() })
  return aposConsulta(r)
}

export async function abrirBoleto(unidade: string, cobranca: string): Promise<ResultadoLink> {
  if (desligada()) return DESLIGADA
  if (!refValida(unidade, 'referencia') || !refValida(cobranca, 'referencia')) {
    return aposConsulta({ tipo: 'referencia_invalida' })
  }
  const sessao = await lerSessao()
  if (!sessao) return aposConsulta({ tipo: 'sessao_invalida' })

  // A URL é credencial: volta só a este navegador e nunca é registrada.
  const r = await chamarSegundaVia('link', {
    sessao,
    unidade,
    cobranca,
    ipCliente: await ipCliente(),
  })
  return aposConsulta(r)
}

/** Fechar o diálogo: os cookies saem sempre; o app é avisado se havia sessão. */
export async function encerrarConsulta(): Promise<void> {
  const sessao = await lerSessao()
  await apagarCookiesSegundaVia()
  if (desligada() || !sessao) return
  // 204 sempre no app; `indisponivel` aqui não muda nada para a pessoa.
  await chamarSegundaVia('encerrar', { sessao })
}
