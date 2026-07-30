import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `submitForm` (Server Action de Contato/Proposta) reescrita na Fase 3/Task 3
 * pra gravar em `cms.leads` via `pg` (`@/lib/db`) em vez de `payload.create`
 * em `form-submissions`. Aqui mockamos as 4 dependências externas
 * (`@/lib/db`, `@/lib/sendgrid`, `@/lib/turnstile`, `next/headers`) e
 * exercitamos o pipeline real (Zod → Turnstile → rate limit → INSERT →
 * e-mail best-effort) sem tocar o Postgres/SendGrid de verdade.
 */

const queryMock = vi.fn()
const sendMailMock = vi.fn()
const verifyTurnstileMock = vi.fn()
const headersMock = vi.fn()
const cookiesMock = vi.fn()
const pushLeadMock = vi.fn()

vi.mock('@/lib/exact/push-lead', () => ({
  pushLeadToExact: (...args: unknown[]) => pushLeadMock(...args),
}))

vi.mock('@/lib/db', () => ({
  query: (...args: unknown[]) => queryMock(...args),
}))

vi.mock('@/lib/sendgrid', () => ({
  sendMail: (...args: unknown[]) => sendMailMock(...args),
}))

vi.mock('@/lib/turnstile', () => ({
  verifyTurnstile: (...args: unknown[]) => verifyTurnstileMock(...args),
}))

vi.mock('next/headers', () => ({
  headers: (...args: unknown[]) => headersMock(...args),
  cookies: (...args: unknown[]) => cookiesMock(...args),
}))

// Import só depois dos `vi.mock` acima (hoisted pelo Vitest, mas mantém aqui
// pela leitura linear do arquivo).
const { submitForm } = await import('@/app/(frontend)/_actions/submit-form')

/** Fake `ReadonlyHeaders` — só o `get` usado por `getClientIp`. */
function fakeHeaders(ip: string) {
  return { get: (name: string) => (name === 'x-forwarded-for' ? ip : null) }
}

/** Fake `ReadonlyRequestCookies` — sem cookie de atribuição (caso comum em teste). */
function fakeCookiesSemAtribuicao() {
  return { get: () => undefined }
}

const contatoValido = {
  nome: 'Fulano de Tal',
  email: 'fulano@example.com',
  mensagem: 'Mensagem de teste automatizado.',
}

describe('submitForm — grava lead em cms.leads (sem Payload)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // O INSERT usa `returning id` — o id é o que liga a linha ao push do Exact.
    queryMock.mockResolvedValue({ rows: [{ id: '99' }], rowCount: 1 })
    sendMailMock.mockResolvedValue({ ok: true })
    verifyTurnstileMock.mockResolvedValue(true)
    cookiesMock.mockResolvedValue(fakeCookiesSemAtribuicao())
    // Default: lead não elegível pro CRM (é o caso dos contatos deste bloco).
    pushLeadMock.mockResolvedValue(null)
  })

  it('contato válido faz INSERT em cms.leads com form/data/email corretos', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.10'))

    const result = await submitForm('contato', contatoValido, 'test-token')

    expect(result.ok).toBe(true)
    expect(queryMock).toHaveBeenCalledTimes(1)

    const [sql, params] = queryMock.mock.calls[0] as [string, unknown[]]
    expect(sql).toMatch(/insert into cms\.leads/i)
    expect(params[0]).toBe('contato')
    expect(params[1]).toMatchObject({
      nome: contatoValido.nome,
      email: contatoValido.email,
      mensagem: contatoValido.mensagem,
    })
    expect(params[3]).toBe(contatoValido.email)

    // E-mail continua sendo enviado (auto-reply best-effort), mas isso não
    // deve mudar a decisão de `ok` — já coberto por `sendMailMock` mockado.
    expect(sendMailMock).toHaveBeenCalled()
  })

  it('dados inválidos (Zod) não chegam a fazer INSERT', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.11'))

    const result = await submitForm(
      'contato',
      { nome: '', email: 'nao-e-email', mensagem: '' },
      'test-token',
    )

    expect(result.ok).toBe(false)
    expect(result.errors).toBeDefined()
    expect(queryMock).not.toHaveBeenCalled()
    expect(verifyTurnstileMock).not.toHaveBeenCalled()
  })

  it('Turnstile falho não chega a fazer INSERT', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.12'))
    verifyTurnstileMock.mockResolvedValue(false)

    const result = await submitForm('contato', contatoValido, 'token-invalido')

    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/anti-spam/i)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('rate limit bloqueia a 6ª tentativa do mesmo IP dentro da janela', async () => {
    const ip = '203.0.113.13'
    headersMock.mockResolvedValue(fakeHeaders(ip))

    for (let i = 0; i < 5; i++) {
      const r = await submitForm('contato', contatoValido, 'test-token')
      expect(r.ok).toBe(true)
    }
    expect(queryMock).toHaveBeenCalledTimes(5)

    const blocked = await submitForm('contato', contatoValido, 'test-token')
    expect(blocked.ok).toBe(false)
    expect(blocked.message).toMatch(/tentativas/i)
    // A 6ª chamada não deve ter chegado ao INSERT.
    expect(queryMock).toHaveBeenCalledTimes(5)
  })

  it('nunca lança — falha no INSERT vira { ok: false } genérico', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.14'))
    queryMock.mockRejectedValue(new Error('connection refused'))

    const result = await submitForm('contato', contatoValido, 'test-token')

    expect(result.ok).toBe(false)
    expect(result.message).toBeDefined()
  })
})

/**
 * Depois do INSERT, a submissão elegível é empurrada pro CRM (Exact) em
 * best-effort — o `pushLeadToExact` é mockado aqui; o mapeamento e o HTTP têm
 * testes próprios (`exact-map-lead` / `exact-push-lead`).
 */
describe('submitForm — push pro Exact', () => {
  const proposta = {
    tipo: 'Condomínio residencial',
    nome: 'Maria Souza',
    nomeCondominio: 'Residencial Aurora',
    email: 'maria@example.com',
    telefone: '+5583999501388',
    cidade: 'João Pessoa e região',
  }

  /** O `update cms.leads` que grava o resultado do push (2ª chamada de query). */
  function updateDoExact() {
    return queryMock.mock.calls.find(([sql]) => /update cms\.leads/i.test(sql as string)) as
      | [string, unknown[]]
      | undefined
  }

  beforeEach(() => {
    vi.resetAllMocks()
    queryMock.mockResolvedValue({ rows: [{ id: '99' }], rowCount: 1 })
    sendMailMock.mockResolvedValue({ ok: true })
    verifyTurnstileMock.mockResolvedValue(true)
    cookiesMock.mockResolvedValue(fakeCookiesSemAtribuicao())
    pushLeadMock.mockResolvedValue(null)
  })

  it('proposta empurra pro Exact e grava o id', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.20'))
    pushLeadMock.mockResolvedValue({ ok: true, exactLeadId: 51199001 })

    const result = await submitForm('proposta', proposta, 'test-token')

    expect(result.ok).toBe(true)
    expect(pushLeadMock).toHaveBeenCalledTimes(1)

    const [formType, data] = pushLeadMock.mock.calls[0] as [string, Record<string, string>]
    expect(formType).toBe('proposta')
    expect(data.nomeCondominio).toBe('Residencial Aurora')

    const update = updateDoExact()
    expect(update).toBeDefined()
    expect((update as [string, unknown[]])[1]).toEqual([51199001, null, '99'])
  })

  it('falha no Exact não derruba a submissão e grava o erro', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.21'))
    pushLeadMock.mockResolvedValue({ ok: false, error: 'Exact POST /LeadsAdd falhou (500)' })

    const result = await submitForm('proposta', proposta, 'test-token')

    expect(result.ok).toBe(true)
    const params = (updateDoExact() as [string, unknown[]])[1]
    expect(params[0]).toBeNull()
    expect(params[1]).toMatch(/500/)
  })

  it('contato criado sem o contato principal guarda o aviso, não o erro', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.24'))
    pushLeadMock.mockResolvedValue({ ok: true, exactLeadId: 7, personError: 'PersonsAdd (500)' })

    await submitForm('proposta', proposta, 'test-token')

    const params = (updateDoExact() as [string, unknown[]])[1]
    expect(params[0]).toBe(7)
    expect(params[1]).toMatch(/PersonsAdd/)
  })

  it('exceção inesperada no push não derruba a submissão', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.22'))
    pushLeadMock.mockRejectedValue(new Error('boom'))

    const result = await submitForm('proposta', proposta, 'test-token')

    expect(result.ok).toBe(true)
  })

  it('lead não elegível (push devolve null) não faz UPDATE', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.23'))
    pushLeadMock.mockResolvedValue(null)

    await submitForm('contato', contatoValido, 'test-token')

    expect(updateDoExact()).toBeUndefined()
  })
})
