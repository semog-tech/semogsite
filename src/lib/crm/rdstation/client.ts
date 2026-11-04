import 'server-only'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'

const BASE = 'https://api.rd.services/crm/v2/'
const recurso = z.object({
  id: z.string().min(1),
  contact_ids: z.array(z.string()).optional(),
  created_at: z.string().datetime().optional(),
})
const lista = z.object({
  data: z.array(recurso),
  links: z.object({ next: z.string().nullable().optional() }).optional(),
})
const resposta = z.object({ data: recurso })

export class RdDuplicadosErro extends Error {
  constructor(ids: string[]) {
    super(`RD Station: negociações duplicadas por id_lead_site; ids: ${ids.join(', ')}`)
  }
}

/** Rejeição explícita permite retry imediato; timeout/5xx exigem reconciliação e espera. */
export class RdHttpErro extends Error {
  constructor(readonly status: number) {
    super(`RD Station: HTTP ${status}`)
  }
}

class RdAntesDoEnvioErro extends Error {
  constructor() {
    super('RD Station: conexão falhou antes de enviar HTTP; nova tentativa permitida')
  }
}

const erroDeConexao = z.object({
  cause: z.object({
    code: z.enum([
      'ENOTFOUND',
      'EAI_AGAIN',
      'ECONNREFUSED',
      'UND_ERR_CONNECT_TIMEOUT',
      'ERR_TLS_CERT_ALTNAME_INVALID',
      'CERT_HAS_EXPIRED',
      'DEPTH_ZERO_SELF_SIGNED_CERT',
    ]),
  }),
})

export function rejeicaoDefinitiva(err: unknown): boolean {
  return (
    err instanceof RdAntesDoEnvioErro ||
    (err instanceof RdHttpErro && [400, 401, 403, 404, 422, 429].includes(err.status))
  )
}

export async function requisitarRd(token: string, path: string, data?: unknown): Promise<unknown> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: data === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: data === undefined ? undefined : JSON.stringify({ data }),
      signal: AbortSignal.timeout(8_000),
      cache: 'no-store',
    })
    // Não incluir corpo, filtros, token ou dados pessoais em mensagens/Sentry.
    if (!res.ok) throw new RdHttpErro(res.status)
    return await res.json()
  } catch (err) {
    if (err instanceof RdHttpErro) throw err
    if (erroDeConexao.safeParse(err).success) throw new RdAntesDoEnvioErro()
    throw new Error('RD Station: falha de rede, prazo ou resposta ilegível')
  }
}

export async function buscarRd(token: string, entidade: 'deals' | 'contacts', filtro: string) {
  if (entidade === 'contacts') return buscarContatoRd(token, filtro)
  const params = new URLSearchParams({ filter: filtro, 'page[size]': '2' })
  const res = lista.parse(await requisitarRd(token, `${entidade}?${params}`))
  if (res.data.length > 1) {
    throw new RdDuplicadosErro(res.data.map((item) => item.id))
  }
  return res.data[0] ?? null
}

async function buscarContatoRd(token: string, filtro: string) {
  const contatos: z.infer<typeof recurso>[] = []
  let pagina = 1
  for (;;) {
    const params = new URLSearchParams({
      filter: filtro,
      'page[size]': '100',
      'page[number]': String(pagina),
      'sort[created_at]': 'asc',
    })
    const res = lista.parse(await requisitarRd(token, `contacts?${params}`))
    contatos.push(...res.data)
    if (!res.links?.next && res.data.length < 100) break
    if (++pagina > 10) throw new Error('RD Station: busca de contato excedeu 1000 registros')
  }
  // Não depende da API honrar sort; desempate por ID é estável, inclusive sem data.
  contatos.sort(
    (a, b) =>
      (a.created_at ? new Date(a.created_at).getTime() : Number.POSITIVE_INFINITY) -
        (b.created_at ? new Date(b.created_at).getTime() : Number.POSITIVE_INFINITY) ||
      a.id.localeCompare(b.id),
  )
  if (contatos.length > 1) {
    Sentry.captureMessage('contato duplicado no RD', {
      level: 'warning',
      extra: { contactIds: contatos.map((c) => c.id) },
    })
    try {
      await Sentry.flush(2_000)
    } catch (err) {
      console.error('[crm] falha ao enviar warning de contato', err)
    }
  }
  return contatos[0] ?? null
}

export async function criarRd(token: string, entidade: 'deals' | 'contacts', data: unknown) {
  return resposta.parse(await requisitarRd(token, entidade, data)).data
}

/** RDQL aceita strings entre aspas; escapar também a barra antes de interpolar. */
export function literalRd(valor: string): string {
  return JSON.stringify(valor)
}
