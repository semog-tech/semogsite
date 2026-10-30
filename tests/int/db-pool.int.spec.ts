import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * O `Pool` de `@/lib/db` é registrado no `attachDatabasePool` da Vercel. Sem
 * isso, a função suspende com o client ocioso aberto e a conexão fica presa no
 * HAProxy até o timeout dele (~1h, sessão `cD` no log).
 *
 * Dois modos de falha a travar: o registro sumir (volta a conexão presa, sem
 * erro nenhum) e o pacote deixar de reconhecer o `Pool` do `pg` — aí
 * `attachDatabasePool` LANÇA ("Unsupported database pool type") no import de
 * `@/lib/db`, e todo acesso ao banco do site cai junto. Por isso o segundo
 * bloco usa o pacote de verdade, sem dublê.
 *
 * Sem banco: o `pg` só conecta na primeira query, e nenhuma é feita aqui.
 */

vi.mock('server-only', () => ({}))

const globalDoPool = globalThis as { __cmsLeadsPool?: unknown }
const CONTEXTO_DA_VERCEL = Symbol.for('@vercel/request-context')
const globalDoContexto = globalThis as { [CONTEXTO_DA_VERCEL]?: unknown }

/** Importa `@/lib/db` do zero — o módulo guarda o pool em `globalThis` fora de produção. */
async function importarDbDoZero() {
  vi.resetModules()
  delete globalDoPool.__cmsLeadsPool
  return import('@/lib/db')
}

afterEach(() => {
  vi.doUnmock('@vercel/functions')
  vi.unstubAllEnvs()
  vi.useRealTimers()
  delete globalDoContexto[CONTEXTO_DA_VERCEL]
  delete globalDoPool.__cmsLeadsPool
})

describe('pool do banco — registro na Vercel', () => {
  it('anexa ao attachDatabasePool exatamente o pool exportado, uma vez', async () => {
    const attach = vi.fn()
    vi.doMock('@vercel/functions', () => ({ attachDatabasePool: attach }))

    const { pool } = await importarDbDoZero()

    expect(attach).toHaveBeenCalledTimes(1)
    expect(attach).toHaveBeenCalledWith(pool)
  })

  it('reimportar o módulo (HMR do dev) reaproveita o pool sem anexar de novo', async () => {
    const attach = vi.fn()
    vi.doMock('@vercel/functions', () => ({ attachDatabasePool: attach }))

    const primeiro = await importarDbDoZero()
    vi.resetModules()
    const segundo = await import('@/lib/db')

    expect(segundo.pool).toBe(primeiro.pool)
    expect(attach).toHaveBeenCalledTimes(1)
  })
})

describe('pool do banco — com o @vercel/functions de verdade', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('fora da Vercel (dev, testes) o import não lança e devolver um client não faz nada', async () => {
    vi.stubEnv('VERCEL_URL', '')
    vi.stubEnv('VERCEL_REGION', '')
    const waitUntil = vi.fn()
    globalDoContexto[CONTEXTO_DA_VERCEL] = { get: () => ({ waitUntil }) }

    const { pool } = await importarDbDoZero()
    pool.emit('release', undefined, {})

    expect(waitUntil).not.toHaveBeenCalled()
  })

  it('na Vercel, devolver um client segura a função viva até o pg fechar o ocioso', async () => {
    vi.stubEnv('VERCEL_URL', 'semogsite.vercel.app')
    vi.stubEnv('VERCEL_REGION', 'gru1')
    const waitUntil = vi.fn()
    globalDoContexto[CONTEXTO_DA_VERCEL] = { get: () => ({ waitUntil }) }

    const { pool } = await importarDbDoZero()
    pool.emit('release', undefined, {})

    expect(waitUntil).toHaveBeenCalledTimes(1)
    const espera: unknown = waitUntil.mock.calls[0]?.[0]
    if (!(espera instanceof Promise)) throw new Error('waitUntil não recebeu uma promise')

    // A espera dura o `idleTimeoutMillis` do pool (+100ms do pacote): antes
    // disso ainda está pendente, depois resolve e a Vercel pode suspender.
    let resolveu = false
    espera.then(
      () => {
        resolveu = true
      },
      (err: unknown) => {
        throw err
      },
    )
    await vi.advanceTimersByTimeAsync(9_000)
    expect(resolveu).toBe(false)
    await vi.advanceTimersByTimeAsync(1_200)
    expect(resolveu).toBe(true)
  })
})
