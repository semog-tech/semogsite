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

const notificationMock = vi.fn()

/**
 * `ContactNotification` espionado: guarda as props (onde vive a seção "Origem
 * do lead") e devolve um elemento qualquer — o `sendMail` já é mockado, então
 * nada disso chega a ser renderizado.
 */
vi.mock('@/emails/ContactNotification', () => ({
  default: (props: unknown) => {
    notificationMock(props)
    return null
  },
}))

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

/**
 * A página do formulário — o quarto argumento de `submitForm`.
 *
 * A atribuição já gravava "Página de entrada", que é o first-touch: a página
 * pela qual a pessoa ENTROU no site. Isso não é a mesma coisa que a página em
 * que ela preencheu o formulário, e a diferença é medível — quem entra pela
 * landing de Belém e converte em `/garante` era contado como Belém, porque o
 * `AttributionTracker` não reescreve o toque a cada navegação (e não deve: o
 * first-touch é o dado que ele existe pra preservar).
 *
 * O mesmo formulário de proposta está em dez páginas. Sem este campo não há
 * como saber qual delas capturou.
 */
describe('submitForm — página do formulário', () => {
  const PAGINA_FIELD = 'origem — Página do formulário'
  const ENTRADA_FIELD = 'origem — Página de entrada'

  /** Proposta válida — o formulário que existe em dez colocações. */
  const propostaValida = {
    tipo: 'Condomínio residencial',
    nome: 'Maria Souza',
    nomeCondominio: 'Residencial Aurora',
    email: 'maria@example.com',
    telefone: '+5583999501388',
    cidade: 'João Pessoa e região',
  }

  /** Fake de cookies com atribuição real (entrada por uma landing de praça). */
  function fakeCookiesComAtribuicao(landing: string) {
    const attr = { first: { landing, ts: '2026-08-23T12:00:00.000Z' }, last: { landing } }
    return { get: () => ({ value: encodeURIComponent(JSON.stringify(attr)) }) }
  }

  /** O `data` (jsonb) do INSERT: `query(sql, params)` → `params[1]`. */
  function leadData(): Record<string, string> {
    const call = queryMock.mock.calls.find(([sql]) => /insert into cms\.leads/i.test(sql as string))
    const params = (call as [string, unknown[]])[1]
    return params[1] as Record<string, string>
  }

  beforeEach(() => {
    vi.resetAllMocks()
    queryMock.mockResolvedValue({ rows: [{ id: '99' }], rowCount: 1 })
    sendMailMock.mockResolvedValue({ ok: true })
    verifyTurnstileMock.mockResolvedValue(true)
    cookiesMock.mockResolvedValue(fakeCookiesSemAtribuicao())
    pushLeadMock.mockResolvedValue(null)
  })

  it('grava a página do formulário junto dos demais campos de origem', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.30'))

    const result = await submitForm('contato', contatoValido, 'test-token', '/garante')

    expect(result.ok).toBe(true)
    expect(leadData()[PAGINA_FIELD]).toBe('/garante')
  })

  /**
   * O caso que motivou o campo: entrada e envio em páginas DIFERENTES, os dois
   * fatos no mesmo lead e sem um sobrescrever o outro.
   */
  it('convive com a página de entrada sem sobrescrevê-la', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.31'))
    cookiesMock.mockResolvedValue(fakeCookiesComAtribuicao('/administradora-de-condominios-belem'))

    await submitForm('contato', contatoValido, 'test-token', '/garante')

    const data = leadData()
    expect(data[ENTRADA_FIELD]).toBe('/administradora-de-condominios-belem')
    expect(data[PAGINA_FIELD]).toBe('/garante')
  })

  /**
   * Entrar e converter na mesma página é o caso mais comum, e o campo continua
   * lá. Omiti-lo quando concorda com a entrada transformaria "mesma página" em
   * "não sei" — e é justamente por página que a tela de captação agrupa.
   */
  it('é gravada mesmo quando coincide com a página de entrada', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.32'))
    cookiesMock.mockResolvedValue(fakeCookiesComAtribuicao('/proposta'))

    await submitForm('proposta', propostaValida, 'test-token', '/proposta')

    const data = leadData()
    expect(data[ENTRADA_FIELD]).toBe('/proposta')
    expect(data[PAGINA_FIELD]).toBe('/proposta')
  })

  it('funciona sem cookie de atribuição nenhum', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.33'))

    await submitForm('contato', contatoValido, 'test-token', '/contato')

    const data = leadData()
    expect(data[PAGINA_FIELD]).toBe('/contato')
    expect(data[ENTRADA_FIELD]).toBeUndefined()
  })

  it('sem o argumento, nenhuma chave de página do formulário é gravada', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.34'))

    await submitForm('contato', contatoValido, 'test-token')

    expect(leadData()[PAGINA_FIELD]).toBeUndefined()
  })

  /**
   * O valor vem do client e por isso é tratado como suspeito: só caminho
   * relativo. Descartar em silêncio é o comportamento certo — a atribuição
   * inteira é best-effort e derrubar um lead por um metadado sujo seria trocar
   * o dado caro pelo barato.
   */
  // Um IP por caso: o rate limit é 5 por minuto por formulário+IP, e seis casos
  // no mesmo IP fariam o sexto falhar por um motivo que não é o testado aqui.
  it.each([
    ['string vazia', '', '203.0.113.40'],
    ['só espaço', '   ', '203.0.113.41'],
    ['URL absoluta', 'https://exemplo.com/phishing', '203.0.113.42'],
    ['protocolo', 'javascript:alert(1)', '203.0.113.43'],
    ['sem barra inicial', 'garante', '203.0.113.44'],
    ['longa demais', `/${'a'.repeat(600)}`, '203.0.113.45'],
  ])('descarta pathname inválido (%s) sem derrubar a submissão', async (_rotulo, pagina, ip) => {
    headersMock.mockResolvedValue(fakeHeaders(ip))

    const result = await submitForm('contato', contatoValido, 'test-token', pagina)

    expect(result.ok).toBe(true)
    expect(leadData()[PAGINA_FIELD]).toBeUndefined()
  })

  /**
   * O e-mail e o `data` do lead leem do MESMO array (`attributionFields`), mas
   * "mesma fonte" é justamente o tipo de coisa que se quebra numa refatoração
   * sem ninguém notar — e a notificação interna é onde o comercial de fato lê a
   * origem. O espião é sobre o componente do e-mail porque chamá-lo como função
   * devolve o elemento já renderizado, cujo `props` é o da raiz do template.
   */
  it('chega ao e-mail de notificação junto da seção de origem', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.36'))

    await submitForm(
      'proposta',
      propostaValida,
      'test-token',
      '/administradora-de-condominios-recife',
    )

    expect(notificationMock).toHaveBeenCalled()
    const props = notificationMock.mock.calls.at(-1)?.[0] as {
      attribution: { label: string; value: string }[]
    }
    expect(props.attribution).toContainEqual({
      label: 'Página do formulário',
      value: '/administradora-de-condominios-recife',
    })
  })
})
