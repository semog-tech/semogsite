import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const queryMock = vi.fn()
const enviarMock = vi.fn()
const relatarMock = vi.fn()

vi.mock('@/lib/rdMarketing/fila', () => ({ agendarRetryMarketing: vi.fn() }))

vi.mock('@/lib/db', () => ({ query: (...args: unknown[]) => queryMock(...args) }))
vi.mock('@/lib/crm/send-lead', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/crm/send-lead')>()),
  enviarLeadAoCrm: (...args: unknown[]) => enviarMock(...args),
  relatarErroCrm: (...args: unknown[]) => relatarMock(...args),
}))
const { GET } = await import('@/app/api/cron/push-crm-leads/route')
const { GET: GETLegado } = await import('@/app/api/cron/push-exact-leads/route')
const pendente = {
  id: '42',
  form: 'proposta',
  data: { nome: 'Maria' },
  crm_provider: null,
  crm_status: 'pendente',
  crm_deal_id: null,
  exact_lead_id: null,
  crm_attempts: 0,
  exact_attempts: 0,
  created_at: new Date(),
  crm_travado_ate: null,
  crm_reconciliar_em: null,
  crm_proxima_tentativa_em: new Date(0),
}
function request(segredo = 'segredo') {
  return new Request('http://localhost/api/cron/push-crm-leads', {
    headers: { authorization: `Bearer ${segredo}` },
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('CRON_SECRET', 'segredo')
  vi.stubEnv('CRM_PROVIDER', 'rdstation')
})
afterEach(() => vi.unstubAllEnvs())

describe('cron CRM: só RD, Exact desligado', () => {
  it('autentica antes de acessar banco ou CRM', async () => {
    expect((await GET(request('errado'))).status).toBe(401)
    expect(queryMock).not.toHaveBeenCalled()
  })
  it.each([
    undefined,
    'exact',
  ])('com a flag %s o cron não consulta a fila nem chama o Exact', async (provider) => {
    vi.stubEnv('CRM_PROVIDER', provider)
    const res = await GET(request())
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ considerados: 0, exact: 'desligado' })
    expect(queryMock).not.toHaveBeenCalled()
    expect(enviarMock).not.toHaveBeenCalled()
  })
  it('seleciona somente fila rdstation e pendentes sem provedor', async () => {
    const provider = 'rdstation'
    queryMock.mockResolvedValue({ rows: [pendente] })
    enviarMock.mockResolvedValue({ ok: true })
    const res = await GET(request())
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ enviados: 1, falhas: 0 })
    const [sql, params] = queryMock.mock.calls[0]
    expect(sql).toContain('(crm_provider is null or crm_provider = $1)')
    expect(sql).toContain('crm_deal_id is null and exact_lead_id is null')
    expect(sql).toContain('crm_attempts < $2')
    expect(sql).toContain('exact_attempts < $2')
    expect(sql).toContain("data->>'duplicaDe' is null")
    expect(sql).toContain('proposta-comercial')
    expect(params[0]).toBe(provider)
    expect(sql).toContain("created_at > now() - interval '48 hours'")
    expect(sql).toContain('crm_travado_ate < now()')
    expect(sql).toContain('order by crm_proxima_tentativa_em asc, id asc limit 25')
    expect(enviarMock).toHaveBeenCalledWith('proposta', pendente.data, '42')
  })
  it('falha parcial responde 502 e continua o lote', async () => {
    queryMock.mockResolvedValue({ rows: [pendente, { ...pendente, id: '43' }] })
    enviarMock.mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true })
    const res = await GET(request())
    expect(res.status).toBe(502)
    expect(await res.json()).toMatchObject({ ok: false, enviados: 1, falhas: 1 })
  })
  it('aguardar conciliação não conta como enviado nem falha e não retorna502', async () => {
    queryMock.mockResolvedValue({ rows: [pendente] })
    enviarMock.mockResolvedValue({ ok: true, aguardando: true })
    const res = await GET(request())
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ enviados: 0, falhas: 0 })
  })
  it('processa lote de25 sem a limitação antiga de3', async () => {
    queryMock.mockResolvedValue({
      rows: Array.from({ length: 25 }, (_, id) => ({ ...pendente, id: String(id) })),
    })
    enviarMock.mockResolvedValue({ ok: true })
    expect((await GET(request())).status).toBe(200)
    expect(enviarMock).toHaveBeenCalledTimes(25)
  })
  it('conciliação marcada perto48h continua sendo processada depois48h', async () => {
    vi.stubEnv('CRM_PROVIDER', 'rdstation')
    queryMock.mockResolvedValue({
      rows: [
        {
          ...pendente,
          crm_deal_id: 'card',
          crm_attempts: 5,
          created_at: new Date(Date.now() - 49 * 3600_000),
          crm_reconciliar_em: new Date(0),
        },
      ],
    })
    enviarMock.mockResolvedValue({ ok: true })
    expect((await GET(request())).status).toBe(200)
    expect(enviarMock).toHaveBeenCalledOnce()
  })
  it('o consumidor não envia lease ocupado mesmo se o banco devolver uma linha obsoleta', async () => {
    queryMock.mockResolvedValue({
      rows: [{ ...pendente, crm_travado_ate: new Date(Date.now() + 60_000) }],
    })
    expect((await GET(request())).status).toBe(200)
    expect(enviarMock).not.toHaveBeenCalled()
  })
  it('endpoint antigo usa RD quando RD é ativo', async () => {
    vi.stubEnv('CRM_PROVIDER', 'rdstation')
    queryMock.mockResolvedValue({ rows: [] })
    expect((await GETLegado(request())).status).toBe(200)
    expect(queryMock.mock.calls[0][1][0]).toBe('rdstation')
  })
  it('flag inválida falha fechado e avisa Sentry', async () => {
    vi.stubEnv('CRM_PROVIDER', 'rdsation')
    expect((await GET(request())).status).toBe(500)
    expect(queryMock).not.toHaveBeenCalled()
    expect(relatarMock).toHaveBeenCalledOnce()
  })
  it('erro de banco vira 500 e é reportado', async () => {
    queryMock.mockRejectedValue(new Error('connection refused'))
    expect((await GET(request())).status).toBe(500)
    expect(relatarMock).toHaveBeenCalledOnce()
  })
})
