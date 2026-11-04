import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  mail: vi.fn(),
  crm: vi.fn(),
  cookie: vi.fn(),
  duplicada: vi.fn(),
  callbacks: [] as (() => Promise<void>)[],
  fetch: vi.fn(),
  warning: vi.fn(),
}))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/db', () => ({ query: mocks.query }))
vi.mock('@/lib/sendgrid', () => ({ sendMail: mocks.mail }))
vi.mock('@/lib/exact/push-lead', () => ({ pushLeadToExact: mocks.crm }))
vi.mock('@/lib/turnstile', () => ({ verifyTurnstile: async () => true }))
vi.mock('@/lib/propostaDuplicada', () => ({ propostaRecenteDoMesmoPedido: mocks.duplicada }))
vi.mock('next/headers', () => ({ headers: async () => new Headers(), cookies: mocks.cookie }))
vi.mock('next/server', () => ({
  after: (callback: () => Promise<void>) => mocks.callbacks.push(callback),
}))
vi.mock('@sentry/nextjs', () => ({
  captureMessage: mocks.warning,
  captureException: vi.fn(),
  flush: async () => true,
}))
const { submitForm, submitPropostaRapida } = await import('@/app/(frontend)/_actions/submit-form')

const proposta = {
  tipo: 'Condomínio residencial',
  nome: 'Maria',
  nomeCondominio: 'Aurora',
  telefone: '+5581999999999',
  email: 'maria@example.invalid',
  cidade: 'Recife e região',
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.callbacks.length = 0
  vi.stubEnv('RD_MARKETING_API_KEY', 'teste-servidor')
  vi.stubGlobal('fetch', mocks.fetch)
  mocks.cookie.mockResolvedValue({ get: () => undefined })
  mocks.mail.mockResolvedValue({ ok: true })
  mocks.crm.mockResolvedValue(null)
  mocks.duplicada.mockResolvedValue(null)
  mocks.query.mockImplementation(async (sql: string) => {
    if (sql.includes('insert into cms.leads')) return { rows: [{ id: '500' }] }
    return { rows: [] }
  })
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('Marketing no pipeline do formulário', () => {
  it('sem chave persiste snapshot NULL e não permite backfill ao configurar depois', async () => {
    vi.stubEnv('RD_MARKETING_API_KEY', '  ')
    expect(await submitForm('proposta', proposta, 'token')).toMatchObject({ ok: true })
    const insert = mocks.query.mock.calls.find(([sql]) => sql.includes('insert into cms.leads'))
    expect(insert?.[1]?.[6]).toBeNull()
    expect(mocks.callbacks).toHaveLength(0)
    expect(mocks.mail).toHaveBeenCalledTimes(2)
    expect(mocks.crm).toHaveBeenCalledOnce()
  })

  it('persiste snapshot no INSERT e só envia depois da resposta; falha não afeta CRM/e-mails', async () => {
    expect(await submitForm('proposta', proposta, 'token')).toMatchObject({ ok: true })
    expect(mocks.crm).toHaveBeenCalledOnce()
    expect(mocks.mail).toHaveBeenCalledTimes(2)
    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(mocks.callbacks).toHaveLength(1)
    const insert = mocks.query.mock.calls.find(([sql]) => sql.includes('insert into cms.leads'))
    expect(insert?.[0]).toContain('rd_marketing_payload')
    const params: unknown[] = insert?.[1] ?? []
    expect(params[6]).toMatchObject({
      payload: { conversion_identifier: 'pedido-proposta-site', name: 'Maria' },
    })
    mocks.query
      .mockResolvedValueOnce({
        rows: [{ id: '500', rd_marketing_payload: params[6], rd_marketing_attempts: 1 }],
      })
      .mockResolvedValueOnce({ rowCount: 1 })
    mocks.fetch.mockRejectedValue(new Error('RD indisponível após resposta'))
    await expect(mocks.callbacks[0]?.()).resolves.toBeUndefined()
    expect(mocks.fetch).toHaveBeenCalledOnce()
    expect(mocks.warning).toHaveBeenCalled()
    expect(mocks.mail).toHaveBeenCalledTimes(2)
    expect(mocks.crm).toHaveBeenCalledOnce()
  })

  it('proposta rápida repetida não cria snapshot nem agenda conversão', async () => {
    mocks.duplicada.mockResolvedValue('123')
    expect(
      await submitPropostaRapida(
        { nome: 'Maria', telefone: '+5581999999999', cidade: 'Recife e região' },
        'token',
      ),
    ).toMatchObject({ ok: true })
    const insert = mocks.query.mock.calls.find(([sql]) => sql.includes('insert into cms.leads'))
    expect(insert?.[1]?.[6]).toBeNull()
    expect(mocks.callbacks).toHaveLength(0)
    expect(mocks.mail).not.toHaveBeenCalled()
    expect(mocks.crm).not.toHaveBeenCalled()
  })

  it('contato de atendimento não pode entrar na fila comercial', async () => {
    expect(
      await submitForm(
        'contato',
        {
          nome: 'Maria',
          email: 'maria@example.invalid',
          assunto: 'segunda-via-boleto',
          mensagem: 'Preciso da segunda via',
        },
        'token',
      ),
    ).toMatchObject({ ok: true })
    const insert = mocks.query.mock.calls.find(([sql]) => sql.includes('insert into cms.leads'))
    expect(insert?.[1]?.[6]).toBeNull()
    // Pode registrar callback no-op por id, mas o snapshot NULL impede qualquer POST.
    await mocks.callbacks[0]?.()
    expect(mocks.fetch).not.toHaveBeenCalled()
  })
})
