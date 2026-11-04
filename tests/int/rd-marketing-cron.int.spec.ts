import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ retry: vi.fn(), query: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/rdMarketing/fila', () => ({ agendarRetryMarketing: mocks.retry }))
vi.mock('@/lib/db', () => ({ query: mocks.query }))

// Contrato público estável: após a junção, este alias reexporta o GET real de
// push-crm-leads. Assim o teste continua executando o handler, não seu texto.
const { GET } = await import('@/app/api/cron/push-exact-leads/route')

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('CRON_SECRET', 'cron-teste')
  mocks.query.mockResolvedValue({ rows: [] })
})
afterEach(() => vi.unstubAllEnvs())

describe('retry Marketing no handler público do cron', () => {
  it.each([undefined, 'errado'])('não agenda sem autorização válida (%s)', async (token) => {
    const headers = token ? { authorization: `Bearer ${token}` } : undefined
    const response = await GET(
      new Request('http://localhost/api/cron/push-exact-leads', { headers }),
    )
    expect(response.status).toBe(401)
    expect(mocks.retry).not.toHaveBeenCalled()
    expect(mocks.query).not.toHaveBeenCalled()
  })

  it('não agenda quando CRON_SECRET não foi configurado', async () => {
    vi.stubEnv('CRON_SECRET', '')
    const response = await GET(new Request('http://localhost/api/cron/push-exact-leads'))
    expect(response.status).toBe(401)
    expect(mocks.retry).not.toHaveBeenCalled()
  })

  it('agenda exatamente uma vez depois de autenticar e antes de consultar o CRM', async () => {
    const response = await GET(
      new Request('http://localhost/api/cron/push-exact-leads', {
        headers: { authorization: 'Bearer cron-teste' },
      }),
    )
    expect(response.status).toBe(200)
    expect(mocks.retry).toHaveBeenCalledOnce()
    expect(mocks.query).toHaveBeenCalled()
    expect(mocks.retry.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.query.mock.invocationCallOrder[0] ?? 0,
    )
  })
})
