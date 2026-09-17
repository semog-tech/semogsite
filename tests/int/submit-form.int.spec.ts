import { EventEmitter } from 'node:events'
import { render } from '@react-email/render'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

// `@/lib/adsConsent` importa `server-only`, que lança no jsdom do vitest —
// mesma neutralização já usada em `exact-push-lead`/`experience-exact-guard`.
vi.mock('server-only', () => ({}))

vi.mock('@/lib/exact/push-lead', () => ({
  pushLeadToExact: (...args: unknown[]) => pushLeadMock(...args),
}))

// `pool` entra porque a inscrição do Experience grava por transação explícita
// num client dedicado (advisory lock — ver `gravarInscricaoDoExperience`). O
// client do dublê delega ao MESMO `queryMock`, então as asserções seguem
// olhando uma lista só de SQL.
vi.mock('@/lib/db', () => ({
  query: (...args: unknown[]) => queryMock(...args),
  pool: {
    // `EventEmitter` porque a transação registra um listener de 'error' no
    // client (ver `gravarInscricaoDoExperience`).
    connect: async () =>
      Object.assign(new EventEmitter(), {
        query: (...args: unknown[]) => queryMock(...args),
        release: () => {},
      }),
  },
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
 * Pra onde vai a NOTIFICAÇÃO INTERNA de cada formulário. Nada disso era
 * testado: `experience-exact-guard` confere só o assunto do e-mail, e o
 * destinatário — que é o que decide se alguém lê a submissão — passava sem
 * cobertura.
 *
 * A inscrição do Experience ganhou caixa própria (a filial que organiza o
 * evento) em 14/09/2026. O teste do Contato é o que importa aqui: ele é a
 * regressão silenciosa desse roteamento — se o ramo novo capturar o Contato
 * junto, ninguém percebe até uma mensagem sumir.
 */
describe('submitForm — destino da notificação interna', () => {
  const CONTACT_TO_ORIGINAL = process.env.CONTACT_TO

  const inscricao = {
    nome: 'Maria Souza',
    email: 'maria@example.com',
    telefone: '+5583999501388',
    condominio: 'Residencial Aurora',
    aceiteImagem: true,
  }

  /**
   * Os destinatários da notificação interna. Filtra pelo assunto porque a mesma
   * `sendMail` também manda o auto-reply, esse sim para o e-mail de quem
   * preencheu — pegar a primeira chamada acertaria por acidente de ordem.
   *
   * Devolve sempre LISTA: desde 16/09/2026 a proposta de "Outra cidade" vai
   * para três caixas de uma vez, e o que precisa ser testado é que elas vão
   * num e-mail só (um `to` com três) e não em três envios.
   */
  function destinoDaNotificacao(): string[] | undefined {
    const chamada = sendMailMock.mock.calls.find(([arg]) =>
      /^Novo contato via /.test((arg as { subject: string }).subject),
    )
    const to = (chamada?.[0] as { to: string | string[] } | undefined)?.to
    if (to === undefined) return undefined
    return Array.isArray(to) ? to : [to]
  }

  /** Quantas notificações internas saíram (o auto-reply não conta). */
  function quantasNotificacoes(): number {
    return sendMailMock.mock.calls.filter(([arg]) =>
      /^Novo contato via /.test((arg as { subject: string }).subject),
    ).length
  }

  beforeEach(() => {
    vi.resetAllMocks()
    queryMock.mockResolvedValue({ rows: [{ id: '99' }], rowCount: 1 })
    sendMailMock.mockResolvedValue({ ok: true })
    verifyTurnstileMock.mockResolvedValue(true)
    cookiesMock.mockResolvedValue(fakeCookiesSemAtribuicao())
    pushLeadMock.mockResolvedValue(null)
    process.env.CONTACT_TO = 'caixa-do-contato@example.com'
  })

  afterEach(() => {
    if (CONTACT_TO_ORIGINAL === undefined) delete process.env.CONTACT_TO
    else process.env.CONTACT_TO = CONTACT_TO_ORIGINAL
  })

  it('inscrição no Experience avisa a filial que organiza o evento', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.30'))

    const result = await submitForm('experience', inscricao, 'test-token')

    expect(result.ok).toBe(true)
    expect(destinoDaNotificacao()).toEqual(['comercial.pb@semog.com.br'])
  })

  it('contato continua indo pro CONTACT_TO', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.31'))

    await submitForm('contato', contatoValido, 'test-token')

    expect(destinoDaNotificacao()).toEqual(['caixa-do-contato@example.com'])
  })

  it('proposta continua roteando por cidade', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.32'))

    await submitForm(
      'proposta',
      {
        tipo: 'Condomínio residencial',
        nome: 'Maria Souza',
        nomeCondominio: 'Residencial Aurora',
        email: 'maria@example.com',
        telefone: '+5583999501388',
        cidade: 'Belém e região',
      },
      'test-token',
    )

    expect(destinoDaNotificacao()).toEqual(['galvao@semog.com.br'])
  })

  /** Monta uma proposta válida variando só a cidade — é ela que decide o destino. */
  function propostaDe(cidade: string) {
    return {
      tipo: 'Condomínio residencial',
      nome: 'Maria Souza',
      nomeCondominio: 'Residencial Aurora',
      email: 'maria@example.com',
      telefone: '+5583999501388',
      cidade,
    }
  }

  it.each([
    ['Recife e região', ['ivan@semog.com.br']],
    ['João Pessoa e região', ['comercial.pb@semog.com.br']],
    ['Campina Grande e região', ['comercial.pb@semog.com.br']],
    ['Belém e região', ['galvao@semog.com.br']],
  ] as const)('proposta de %s vai para %s', async (cidade, esperado) => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.50'))

    await submitForm('proposta', propostaDe(cidade), 'test-token')

    expect(destinoDaNotificacao()).toEqual(esperado)
  })

  it('o grupo comercial@ não recebe mais NENHUMA proposta', async () => {
    // O grupo saiu do roteamento em 16/09/2026 — lista de distribuição não
    // responde, e o desfecho que chega por ela não tem autor. Este teste é a
    // trava: qualquer cidade que volte a apontar pra lá reprova aqui.
    for (const cidade of [
      'Recife e região',
      'João Pessoa e região',
      'Campina Grande e região',
      'Belém e região',
      'Outra cidade',
    ]) {
      vi.clearAllMocks()
      queryMock.mockResolvedValue({ rows: [{ id: '99' }], rowCount: 1 })
      sendMailMock.mockResolvedValue({ ok: true })
      verifyTurnstileMock.mockResolvedValue(true)
      cookiesMock.mockResolvedValue(fakeCookiesSemAtribuicao())
      pushLeadMock.mockResolvedValue(null)
      headersMock.mockResolvedValue(fakeHeaders(`198.51.100.${cidade.length}`))

      await submitForm('proposta', propostaDe(cidade), 'test-token')

      expect(destinoDaNotificacao()).not.toContain('comercial@semog.com.br')
    }
  })

  it('"Outra cidade" vai para os três responsáveis, num e-mail só', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.51'))

    await submitForm('proposta', propostaDe('Outra cidade'), 'test-token')

    // A ordem importa menos que o conjunto; o que NÃO pode variar é serem três
    // numa chamada só — três chamadas seriam três e-mails, e aí cada um pensaria
    // que é o único a ter recebido.
    expect(destinoDaNotificacao()?.slice().sort()).toEqual([
      'comercial.pb@semog.com.br',
      'galvao@semog.com.br',
      'ivan@semog.com.br',
    ])
    expect(quantasNotificacoes()).toBe(1)
  })

  it('o auto-reply da inscrição vai pra quem se inscreveu, não pra filial', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.33'))

    await submitForm('experience', inscricao, 'test-token')

    // Trocar o destino da notificação interna não pode mexer no que o inscrito
    // recebe: são duas chamadas distintas de `sendMail`.
    const destinos = sendMailMock.mock.calls.map(([arg]) => (arg as { to: string }).to)
    expect(destinos).toContain(inscricao.email)
  })
})

/**
 * Botões de desfecho no e-mail de notificação (16/09/2026). O token é o de
 * verdade — `@/lib/desfechoToken` não é mockado aqui, só o `server-only` que
 * ele importa (já neutralizado no topo do arquivo).
 *
 * O critério é `isExactEligible` — a mesma função que decide o que vira card no
 * CRM. Isso abrange a Proposta E o Contato com assunto `proposta-comercial`,
 * que é pedido de proposta escrito no formulário errado e já entra no CRM como
 * lead. Fica de fora o resto do Contato (2ª via, CND, acordo), que é
 * atendimento a quem já é cliente, e a inscrição no Experience, que não é lead
 * nenhum — "fechou" nesses dois é pergunta sem resposta possível.
 */
describe('submitForm — botões de desfecho no e-mail interno', () => {
  const SEGREDO_ORIGINAL = process.env.LEAD_OUTCOME_SECRET

  const proposta = {
    tipo: 'Condomínio residencial',
    nome: 'Maria Souza',
    nomeCondominio: 'Residencial Aurora',
    email: 'maria@example.com',
    telefone: '+5583999501388',
    cidade: 'Recife e região',
  }

  /**
   * Os `href` dos links da notificação interna (não do auto-reply), lidos do
   * HTML REALMENTE renderizado.
   *
   * Inspecionar as props do elemento não serviria: `submit-form.ts` chama
   * `ContactNotification({…})` como função, não como JSX, então o que chega ao
   * `sendMail` já é a árvore montada — `props.desfecho` não existe ali. E
   * mesmo que existisse, provaria só que o valor foi passado, não que virou
   * link no e-mail. Este e-mail não tinha nenhum link até agora, então lista
   * vazia é o estado anterior.
   */
  async function linksDaNotificacao(): Promise<string[]> {
    const chamada = sendMailMock.mock.calls.find(([arg]) =>
      /^Novo contato via /.test((arg as { subject: string }).subject),
    )
    const elemento = chamada?.[0] as { react: ReactElement } | undefined
    if (!elemento) return []
    const html = await render(elemento.react)
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return Array.from(doc.querySelectorAll('a')).map((a) => a.getAttribute('href') ?? '')
  }

  beforeEach(() => {
    vi.resetAllMocks()
    queryMock.mockResolvedValue({ rows: [{ id: '4242' }], rowCount: 1 })
    sendMailMock.mockResolvedValue({ ok: true })
    verifyTurnstileMock.mockResolvedValue(true)
    cookiesMock.mockResolvedValue(fakeCookiesSemAtribuicao())
    pushLeadMock.mockResolvedValue(null)
    process.env.CONTACT_TO = 'caixa-do-contato@example.com'
    process.env.LEAD_OUTCOME_SECRET = 'segredo-de-teste-nao-usado-em-producao'
  })

  afterEach(() => {
    if (SEGREDO_ORIGINAL === undefined) delete process.env.LEAD_OUTCOME_SECRET
    else process.env.LEAD_OUTCOME_SECRET = SEGREDO_ORIGINAL
  })

  it('proposta leva os quatro botões, com o id da linha recém-inserida', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.40'))

    await submitForm('proposta', proposta, 'test-token')

    const links = await linksDaNotificacao()
    expect(links).toHaveLength(4)
    expect(links.map((url) => new URL(url).searchParams.get('s'))).toEqual([
      'negociando',
      'fechou',
      'nao_evoluiu',
      'nao_e_lead',
    ])
    // O id vem do `returning id` do INSERT — sem ele o link apontaria pro lead
    // errado (ou pra lugar nenhum).
    for (const url of links) {
      expect(new URL(url).pathname).toBe('/desfecho/4242')
      expect(new URL(url).searchParams.get('t')).toBeTruthy()
    }
  })

  it('contato de atendimento não leva botões', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.41'))

    await submitForm('contato', { ...contatoValido, assunto: 'segunda-via-boleto' }, 'test-token')

    expect(await linksDaNotificacao()).toEqual([])
  })

  it('contato SEM assunto não leva botões', async () => {
    // `assunto` é opcional no schema. Ausente, não há o que sustente chamar
    // aquilo de captação — e o default tem que ser não perguntar.
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.45'))

    await submitForm('contato', contatoValido, 'test-token')

    expect(await linksDaNotificacao()).toEqual([])
  })

  it('contato com assunto "proposta-comercial" LEVA os botões', async () => {
    // É pedido de proposta escrito no formulário errado: já entra no CRM como
    // lead pela mesma regra, e por isso também tem desfecho a registrar.
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.46'))

    await submitForm('contato', { ...contatoValido, assunto: 'proposta-comercial' }, 'test-token')

    const links = await linksDaNotificacao()
    expect(links).toHaveLength(4)
    expect(links.map((url) => new URL(url).searchParams.get('s'))).toEqual([
      'negociando',
      'fechou',
      'nao_evoluiu',
      'nao_e_lead',
    ])
  })

  it('a regra dos botões é a MESMA que manda o lead pro CRM', async () => {
    // Trava contra as duas regras divergirem: se `isExactEligible` passar a
    // aceitar (ou recusar) um caso, os botões acompanham por construção. Um
    // ramo próprio no `submit-form` reprovaria aqui.
    const { isExactEligible } = await import('@/lib/exact/map-lead')

    const casos = [
      { form: 'contato' as const, valores: { ...contatoValido, assunto: 'proposta-comercial' } },
      { form: 'contato' as const, valores: { ...contatoValido, assunto: 'cnd-condominio' } },
      { form: 'proposta' as const, valores: proposta },
    ]

    for (const [i, caso] of casos.entries()) {
      vi.clearAllMocks()
      queryMock.mockResolvedValue({ rows: [{ id: '4242' }], rowCount: 1 })
      sendMailMock.mockResolvedValue({ ok: true })
      verifyTurnstileMock.mockResolvedValue(true)
      cookiesMock.mockResolvedValue(fakeCookiesSemAtribuicao())
      pushLeadMock.mockResolvedValue(null)
      headersMock.mockResolvedValue(fakeHeaders(`198.51.100.${200 + i}`))

      await submitForm(caso.form, caso.valores, 'test-token')

      const temBotoes = (await linksDaNotificacao()).length > 0
      const dados = Object.fromEntries(Object.entries(caso.valores).map(([k, v]) => [k, String(v)]))
      expect(temBotoes).toBe(isExactEligible(caso.form, dados))
    }
  })

  it('inscrição no Experience não leva botões', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.42'))

    await submitForm(
      'experience',
      {
        nome: 'Maria Souza',
        email: 'maria@example.com',
        telefone: '+5583999501388',
        condominio: 'Residencial Aurora',
        aceiteImagem: true,
      },
      'test-token',
    )

    expect(await linksDaNotificacao()).toEqual([])
  })

  it('sem LEAD_OUTCOME_SECRET a proposta sai sem botões — e a submissão segue ok', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.43'))
    delete process.env.LEAD_OUTCOME_SECRET

    const resultado = await submitForm('proposta', proposta, 'test-token')

    expect(resultado.ok).toBe(true)
    expect(await linksDaNotificacao()).toEqual([])
  })

  it('INSERT sem id devolvido não inventa link nenhum', async () => {
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.44'))
    queryMock.mockResolvedValue({ rows: [], rowCount: 0 })

    const resultado = await submitForm('proposta', proposta, 'test-token')

    expect(resultado.ok).toBe(true)
    expect(await linksDaNotificacao()).toEqual([])
  })
})

/**
 * `cidade` virou obrigatória na Proposta em 16/09/2026, e com ela sumiu o
 * destino de fallback. O que estes testes defendem é o par: o servidor recusa
 * sozinho (não confia na tela) e a recusa acontece ANTES do INSERT, para uma
 * proposta sem praça não entrar na base e depois não ter para onde ser
 * roteada.
 *
 * É mudança em formulário de captação — o mesmo que ficou mudo por 12 dias em
 * agosto —, então a cobertura aqui é a trava de quem tenta reabrir a porta.
 */
describe('submitForm — cidade obrigatória na proposta', () => {
  const semCidade = {
    tipo: 'Condomínio residencial',
    nome: 'Maria Souza',
    nomeCondominio: 'Residencial Aurora',
    email: 'maria@example.com',
    telefone: '+5583999501388',
  }

  beforeEach(() => {
    vi.resetAllMocks()
    queryMock.mockResolvedValue({ rows: [{ id: '99' }], rowCount: 1 })
    sendMailMock.mockResolvedValue({ ok: true })
    verifyTurnstileMock.mockResolvedValue(true)
    cookiesMock.mockResolvedValue(fakeCookiesSemAtribuicao())
    pushLeadMock.mockResolvedValue(null)
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.60'))
  })

  it('proposta sem cidade é recusada, com erro no campo, e não grava', async () => {
    const resultado = await submitForm('proposta', semCidade, 'test-token')

    expect(resultado.ok).toBe(false)
    expect(resultado.errors?.cidade).toBeDefined()
    expect(queryMock).not.toHaveBeenCalled()
    expect(sendMailMock).not.toHaveBeenCalled()
  })

  it('cidade em branco também é recusada — burlar o select não passa', async () => {
    // O caminho de quem manda a requisição na mão, ou de um client que envie o
    // valor do placeholder em vez de omitir o campo.
    const resultado = await submitForm('proposta', { ...semCidade, cidade: '' }, 'test-token')

    expect(resultado.ok).toBe(false)
    expect(resultado.errors?.cidade).toBeDefined()
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('cidade fora da lista é recusada', async () => {
    const resultado = await submitForm(
      'proposta',
      { ...semCidade, cidade: 'Fortaleza e região' },
      'test-token',
    )

    expect(resultado.ok).toBe(false)
    expect(resultado.errors?.cidade).toBeDefined()
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('a mensagem de erro diz o que fazer', async () => {
    const resultado = await submitForm('proposta', semCidade, 'test-token')

    expect(resultado.errors?.cidade).toMatch(/selecione a cidade/i)
  })

  it('as cinco cidades do enum continuam passando', async () => {
    for (const cidade of [
      'Recife e região',
      'João Pessoa e região',
      'Campina Grande e região',
      'Belém e região',
      'Outra cidade',
    ]) {
      vi.clearAllMocks()
      queryMock.mockResolvedValue({ rows: [{ id: '99' }], rowCount: 1 })
      sendMailMock.mockResolvedValue({ ok: true })
      verifyTurnstileMock.mockResolvedValue(true)
      cookiesMock.mockResolvedValue(fakeCookiesSemAtribuicao())
      pushLeadMock.mockResolvedValue(null)
      headersMock.mockResolvedValue(fakeHeaders(`198.51.100.${cidade.length + 100}`))

      const resultado = await submitForm('proposta', { ...semCidade, cidade }, 'test-token')

      expect(resultado.ok).toBe(true)
    }
  })

  it('o contato continua sem campo de cidade nenhum', async () => {
    // A obrigatoriedade é da Proposta. O Contato não tem esse campo e não pode
    // ter sido arrastado junto.
    const resultado = await submitForm('contato', contatoValido, 'test-token')

    expect(resultado.ok).toBe(true)
  })
})

/**
 * `notificado_para` — para qual endereço a notificação deste lead foi
 * ENDEREÇADA, gravado na própria linha no momento do envio.
 *
 * É o que separa, depois, um desfecho com autor conhecido de um que veio de
 * caixa compartilhada, sem perguntar identidade a ninguém. Está em coluna, e não
 * derivado da cidade na hora da consulta, porque o roteamento muda: o mapa já
 * foi reescrito uma vez, e derivar faria o lead antigo responder com o destino
 * de hoje.
 */
describe('submitForm — grava a quem o lead foi endereçado', () => {
  const proposta = {
    tipo: 'Condomínio residencial',
    nome: 'Maria Souza',
    nomeCondominio: 'Residencial Aurora',
    email: 'maria@example.com',
    telefone: '+5583999501388',
    cidade: 'Recife e região',
  }

  /** O valor de `notificado_para` no INSERT (6º parâmetro). */
  function notificadoPara(): unknown {
    const insert = queryMock.mock.calls.find(([sql]) => /insert into cms\.leads/i.test(sql)) as
      | [string, unknown[]]
      | undefined
    expect(insert?.[0]).toMatch(/notificado_para/i)
    return insert?.[1][5]
  }

  beforeEach(() => {
    vi.resetAllMocks()
    queryMock.mockResolvedValue({ rows: [{ id: '99' }], rowCount: 1 })
    sendMailMock.mockResolvedValue({ ok: true })
    verifyTurnstileMock.mockResolvedValue(true)
    cookiesMock.mockResolvedValue(fakeCookiesSemAtribuicao())
    pushLeadMock.mockResolvedValue(null)
    headersMock.mockResolvedValue(fakeHeaders('203.0.113.70'))
    process.env.CONTACT_TO = 'caixa-do-contato@example.com'
  })

  it('caixa individual entra sozinha na coluna', async () => {
    await submitForm('proposta', proposta, 'test-token')

    expect(notificadoPara()).toBe('ivan@semog.com.br')
  })

  it('"Outra cidade" grava os três, separados por vírgula', async () => {
    await submitForm('proposta', { ...proposta, cidade: 'Outra cidade' }, 'test-token')

    // A página conta as vírgulas pra avisar que outra pessoa pode ter
    // respondido antes — por isso os três precisam caber numa string só.
    expect(notificadoPara()).toBe(
      'ivan@semog.com.br, galvao@semog.com.br, comercial.pb@semog.com.br',
    )
  })

  it('o endereçado é o MESMO que recebeu o e-mail — não dois caminhos que podem divergir', async () => {
    await submitForm('proposta', { ...proposta, cidade: 'Belém e região' }, 'test-token')

    const chamada = sendMailMock.mock.calls.find(([arg]) =>
      /^Novo contato via /.test((arg as { subject: string }).subject),
    )
    expect(chamada).toBeDefined()
    const { to } = (chamada as [{ to: string | string[] }])[0]
    expect(String(notificadoPara()).split(', ')).toEqual(Array.isArray(to) ? to : [to])
  })

  it('contato grava o CONTACT_TO', async () => {
    await submitForm('contato', contatoValido, 'test-token')

    expect(notificadoPara()).toBe('caixa-do-contato@example.com')
  })

  it('sem CONTACT_TO grava NULL, e não string vazia', async () => {
    // Coluna vazia é "não avisamos ninguém"; `''` seria um endereço em branco.
    delete process.env.CONTACT_TO

    await submitForm('contato', contatoValido, 'test-token')

    expect(notificadoPara()).toBeNull()
  })
})
