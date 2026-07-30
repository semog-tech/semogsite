import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Cron `push-exact-leads`: varre leads recentes que ainda não entraram no CRM e
 * reenvia. Rede de segurança — o caminho normal é síncrono na Server Action do
 * formulário. `@/lib/db` e `@/lib/exact/push-lead` mockados.
 */

const queryMock = vi.fn()
const pushLeadMock = vi.fn()

vi.mock('@/lib/db', () => ({ query: (...args: unknown[]) => queryMock(...args) }))
vi.mock('@/lib/exact/push-lead', () => ({
  pushLeadToExact: (...args: unknown[]) => pushLeadMock(...args),
}))

const { GET } = await import('@/app/api/cron/push-exact-leads/route')

function fakeRequest(bearer?: string): Request {
  const headers = new Headers()
  if (bearer !== undefined) headers.set('authorization', `Bearer ${bearer}`)
  return new Request('http://localhost/api/cron/push-exact-leads', { headers })
}

const pendente = {
  id: '42',
  form: 'proposta',
  data: { nome: 'Maria', nomeCondominio: 'Aurora', email: 'm@x.com', telefone: '+5583999501388' },
}

/** O `update cms.leads` que grava o resultado do push. */
function updates() {
  return queryMock.mock.calls.filter(([sql]) => /update cms\.leads/i.test(sql as string)) as Array<
    [string, unknown[]]
  >
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('CRON_SECRET', 'segredo-de-teste')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('cron push-exact-leads', () => {
  it('sem bearer correto devolve 401 e não consulta o banco', async () => {
    const res = await GET(fakeRequest('errado'))
    expect(res.status).toBe(401)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('reenvia pendente e grava o id', async () => {
    queryMock.mockResolvedValueOnce({ rows: [pendente] }).mockResolvedValue({ rows: [] })
    pushLeadMock.mockResolvedValue({ ok: true, exactLeadId: 777 })

    const res = await GET(fakeRequest('segredo-de-teste'))
    const body = (await res.json()) as { ok: boolean; enviados: number; falhas: number }

    expect(res.status).toBe(200)
    expect(body).toMatchObject({ ok: true, enviados: 1, falhas: 0 })
    expect(pushLeadMock).toHaveBeenCalledWith('proposta', pendente.data)
    expect(updates()[0][1]).toEqual([777, null, '42'])
  })

  it('a query só busca captação pendente e recente', async () => {
    queryMock.mockResolvedValue({ rows: [] })

    await GET(fakeRequest('segredo-de-teste'))

    const [sql] = queryMock.mock.calls[0] as [string, unknown[]]
    expect(sql).toMatch(/exact_lead_id is null/i)
    expect(sql).toMatch(/exact_attempts </i)
    expect(sql).toMatch(/proposta-comercial/)
  })

  it('falha continua contabilizada e não interrompe o lote', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [pendente, { ...pendente, id: '43' }] })
      .mockResolvedValue({ rows: [] })
    pushLeadMock
      .mockResolvedValueOnce({ ok: false, error: 'Exact fora do ar' })
      .mockResolvedValueOnce({ ok: true, exactLeadId: 778 })

    const res = await GET(fakeRequest('segredo-de-teste'))
    const body = (await res.json()) as { ok: boolean; enviados: number; falhas: number }

    expect(body).toMatchObject({ ok: false, enviados: 1, falhas: 1 })
    expect(pushLeadMock).toHaveBeenCalledTimes(2)
    expect(updates()).toHaveLength(2)
  })

  it('nada pendente não chama a API', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })
    const res = await GET(fakeRequest('segredo-de-teste'))
    expect((await res.json()).enviados).toBe(0)
    expect(pushLeadMock).not.toHaveBeenCalled()
  })

  it('erro no banco vira 500, não exceção', async () => {
    queryMock.mockRejectedValue(new Error('connection refused'))
    const res = await GET(fakeRequest('segredo-de-teste'))
    expect(res.status).toBe(500)
  })
})
