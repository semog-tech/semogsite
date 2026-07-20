export type RateLimitOptions = {
  /** Máximo de requisições permitidas dentro da janela. */
  max: number
  /** Tamanho da janela deslizante, em milissegundos. */
  windowMs: number
}

export type RateLimitResult = {
  ok: boolean
  /** Segundos até a próxima requisição ser permitida (só presente quando `ok: false`). */
  retryAfter?: number
}

/**
 * `key` (ex.: IP do lead, `contact-form:<ip>`) → timestamps (ms) das
 * requisições ainda dentro da janela. Array fica naturalmente limitado a no
 * máximo `max` entradas por chave, porque só empurramos timestamp novo
 * quando a requisição é permitida.
 *
 * **Limitação conhecida (in-memory, por instância):** este `Map` vive na
 * memória de UM processo Node. Funciona bem num server tradicional (Node
 * persistente) ou num único dev server, mas em ambientes **serverless**
 * (Vercel Functions etc.) cada instância/invocação fria pode ter seu próprio
 * `Map` vazio — o limite deixa de ser global e um atacante distribuído entre
 * instâncias pode passar de `max`. Suficiente para o volume baixo esperado
 * do formulário de contato; se precisar de garantia real cross-instância,
 * trocar o `Map` por um store externo (Upstash Redis, Vercel KV, etc.)
 * mantendo a mesma assinatura de `rateLimit`.
 */
const requests = new Map<string, number[]>()

/**
 * Rate limiter simples em memória — janela deslizante (sliding window log)
 * por chave. `key` deve identificar o que está sendo limitado (ex.:
 * `${formSlug}:${ip}`); `max`/`windowMs` definem quantas requisições cabem
 * na janela.
 */
export function rateLimit(key: string, { max, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const windowStart = now - windowMs
  const timestamps = (requests.get(key) ?? []).filter((t) => t > windowStart)

  if (timestamps.length >= max) {
    requests.set(key, timestamps)
    const oldest = timestamps[0] as number
    const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))
    return { ok: false, retryAfter }
  }

  timestamps.push(now)
  requests.set(key, timestamps)
  return { ok: true }
}
