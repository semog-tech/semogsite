import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EXPERIENCE_EVENT } from '@/data/experienceEvent'
import { isExactEligible } from '@/lib/exact/map-lead'

describe('isExactEligible', () => {
  it('nunca envia inscrição do Experience ao CRM', () => {
    expect(isExactEligible('experience', { nome: 'Maria', email: 'm@e.com' })).toBe(false)
  })

  it('não envia nem quando o payload traz o assunto comercial', () => {
    // Blindagem: hoje o ramo final olha `data.assunto`. Sem a guarda explícita,
    // um campo com esse nome faria uma inscrição de evento virar lead comercial.
    expect(isExactEligible('experience', { assunto: 'proposta-comercial' })).toBe(false)
  })

  it('continua enviando proposta', () => {
    expect(isExactEligible('proposta', {})).toBe(true)
  })

  it('continua enviando contato com assunto comercial', () => {
    expect(isExactEligible('contato', { assunto: 'proposta-comercial' })).toBe(true)
  })

  it('não envia contato de outro assunto', () => {
    expect(isExactEligible('contato', { assunto: 'duvida' })).toBe(false)
  })
})

/**
 * O bloco acima testa a guarda direto. Este exercita o CAMINHO REAL da Server
 * Action — `submitForm` → `pushLeadToExact` → `isExactEligible` — porque é o
 * que a especificação pede ("`submitForm` com `form: 'experience'`: grava em
 * `cms.leads` e **não** chama o Exact") e é o que `tests/int/submit-form.int.spec.ts`
 * não consegue cobrir: lá o `@/lib/exact/push-lead` inteiro é mockado, então a
 * guarda nunca roda. Aqui o mock desce um nível — só o `client` HTTP do Exact —
 * e o controle com `proposta` prova que o caminho continua vivo para captação.
 *
 * `server-only` precisa ser neutralizado: `push-lead.ts` o importa e ele lança
 * fora de um ambiente de servidor (a suíte roda em jsdom).
 */

const createLeadMock = vi.fn()
const createPersonMock = vi.fn()
const queryMock = vi.fn()
const sendMailMock = vi.fn()
const verifyTurnstileMock = vi.fn()
const headersMock = vi.fn()
const cookiesMock = vi.fn()

vi.mock('server-only', () => ({}))
vi.mock('@/lib/exact/client', () => ({
  exactEnabled: () => true,
  createLead: (...args: unknown[]) => createLeadMock(...args),
  createPerson: (...args: unknown[]) => createPersonMock(...args),
}))
vi.mock('@/lib/db', () => ({ query: (...args: unknown[]) => queryMock(...args) }))
vi.mock('@/lib/sendgrid', () => ({ sendMail: (...args: unknown[]) => sendMailMock(...args) }))
vi.mock('@/lib/turnstile', () => ({
  verifyTurnstile: (...args: unknown[]) => verifyTurnstileMock(...args),
}))
vi.mock('next/headers', () => ({
  headers: (...args: unknown[]) => headersMock(...args),
  cookies: (...args: unknown[]) => cookiesMock(...args),
}))

const { submitForm } = await import('@/app/(frontend)/_actions/submit-form')

const inscricao = {
  nome: 'Maria Souza',
  email: 'maria@exemplo.com.br',
  telefone: '+5583999501388',
  condominio: 'Residencial Cabo Branco',
  acompanhantes: 2,
  aceiteImagem: true,
}

describe('submitForm — inscrição do Experience', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    queryMock.mockResolvedValue({ rows: [{ id: '77' }], rowCount: 1 })
    sendMailMock.mockResolvedValue({ ok: true })
    verifyTurnstileMock.mockResolvedValue(true)
    cookiesMock.mockResolvedValue({ get: () => undefined })
    headersMock.mockResolvedValue({
      get: (name: string) => (name === 'x-forwarded-for' ? '198.51.100.7' : null),
    })
  })

  it('grava em cms.leads com form = experience e os seis campos', async () => {
    const result = await submitForm('experience', inscricao, 'test-token')

    expect(result.ok).toBe(true)
    const [sql, params] = queryMock.mock.calls[0] as [string, unknown[]]
    expect(sql).toMatch(/insert into cms\.leads/i)
    expect(params[0]).toBe('experience')
    expect(params[1]).toEqual({
      nome: 'Maria Souza',
      email: 'maria@exemplo.com.br',
      telefone: '+5583999501388',
      condominio: 'Residencial Cabo Branco',
      acompanhantes: '2',
      aceiteImagem: 'true',
    })
  })

  it('não cria nada no Exact', async () => {
    await submitForm('experience', inscricao, 'test-token')

    expect(createLeadMock).not.toHaveBeenCalled()
    expect(createPersonMock).not.toHaveBeenCalled()
    // Nem `update cms.leads` de resultado do push: `pushLeadToExact` devolve
    // `null` e a Server Action nem chega ao UPDATE.
    expect(
      queryMock.mock.calls.filter(([sql]) => /update cms\.leads/i.test(sql as string)),
    ).toEqual([])
  })

  it('não cria no Exact nem se o payload trouxer o assunto comercial', async () => {
    await submitForm('experience', { ...inscricao, assunto: 'proposta-comercial' }, 'test-token')

    expect(createLeadMock).not.toHaveBeenCalled()
  })

  it('controle: proposta continua indo pro Exact pelo mesmo caminho', async () => {
    createLeadMock.mockResolvedValue(51199001)
    createPersonMock.mockResolvedValue(undefined)

    const result = await submitForm(
      'proposta',
      {
        tipo: 'Condomínio residencial',
        nome: 'Maria Souza',
        nomeCondominio: 'Residencial Aurora',
        email: 'maria@exemplo.com.br',
        telefone: '+5583999501388',
        cidade: 'João Pessoa e região',
      },
      'test-token',
    )

    expect(result.ok).toBe(true)
    expect(createLeadMock).toHaveBeenCalledTimes(1)
  })

  it('a confirmação enviada é a do evento, não o auto-reply genérico do site', async () => {
    await submitForm('experience', inscricao, 'test-token')

    const assuntos = sendMailMock.mock.calls.map(([arg]) => (arg as { subject: string }).subject)
    // Lido da fonte única: o nome carrega a edição ('Semog Experience 26') e
    // muda todo ano — literal aqui quebraria a suíte na virada.
    expect(assuntos).toContain(`Inscrição recebida — ${EXPERIENCE_EVENT.name}`)
    expect(assuntos).not.toContain('Recebemos seu contato — Semog')
  })
})
