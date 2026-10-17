import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
// authorize() que nunca resolve: o Google pendurado na troca do token.
vi.mock('google-auth-library', () => ({
  JWT: class {
    authorize() {
      return new Promise(() => {})
    }
  },
}))

const { ingerirConversoes, obterTokenAds } = await import('@/lib/ads/conversoes')

const CONFIG = {
  login: '1',
  customer: '2',
  acaoProposta: '999',
  subject: 'sa@semog.com.br',
  saJson: JSON.stringify({ client_email: 'sa@x', private_key: 'k' }),
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('prazo das chamadas ao Google (D1)', () => {
  it('token que nunca responde vira erro dentro do prazo', async () => {
    const inicio = Date.now()
    await expect(obterTokenAds(CONFIG, 30)).rejects.toThrow(/passou de 30 ms/)
    expect(Date.now() - inicio).toBeLessThan(1000)
  })

  it('ingest cujo fetch nunca resolve (nem respeita o sinal) vira erro dentro do prazo', async () => {
    const fetchMock = vi.fn(() => new Promise<Response>(() => {}))
    vi.stubGlobal('fetch', fetchMock)
    const inicio = Date.now()
    await expect(ingerirConversoes('t', CONFIG, '999', [], 30)).rejects.toThrow(/passou de 30 ms/)
    expect(Date.now() - inicio).toBeLessThan(1000)
    // O fetch recebe um sinal de aborto, para a conexão também cair.
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1] // as: vi.fn sem tipos dos parâmetros
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('resposta dentro do prazo segue normal', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 200 })),
    )
    await expect(ingerirConversoes('t', CONFIG, '999', [], 1000)).resolves.toMatchObject({
      ok: true,
      status: 200,
    })
  })
})
