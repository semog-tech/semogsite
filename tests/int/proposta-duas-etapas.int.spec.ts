import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LinhaDoLead } from '@/lib/leads/linha'
import { rateLimit } from '@/lib/rate-limit'

/**
 * Actions das duas etapas com o pipeline real (schema → rate limit → Turnstile → SQL → pós-gravação)
 * e as bordas mocadas: banco, Turnstile, Exact, SendGrid, Ads, Sentry e `next/headers`. O banco é
 * uma tabela em memória que segue o WHERE das consultas; o texto do SQL também é conferido, e o
 * comportamento real do SQL foi conferido no Postgres na Tarefa 2.1 (`conferir`) e é de novo na 2.7.
 * Import direto do módulo, sem o transform de Server Actions: o registro das actions é conferido
 * pelo `check:server-actions` e pela invocação real na 2.7.
 */

const queryMock = vi.fn()
const verifyTurnstileMock = vi.fn()
const pushLeadMock = vi.fn()
const sendMailMock = vi.fn()
const ingerirMock = vi.fn()
const captureExceptionMock = vi.fn()
const setCookieMock = vi.fn()
const deleteCookieMock = vi.fn()
const jar = new Map<string, string>()
let ipAtual = '203.0.113.1'
let contadorDeIp = 0

vi.mock('server-only', () => ({}))
vi.mock('@sentry/nextjs', () => ({
  captureException: (...a: unknown[]) => captureExceptionMock(...a),
}))
vi.mock('@/lib/db', () => ({ query: (...a: unknown[]) => queryMock(...a) }))
vi.mock('@/lib/turnstile', () => ({
  verifyTurnstile: (...a: unknown[]) => verifyTurnstileMock(...a),
}))
vi.mock('@/lib/exact/push-lead', () => ({
  pushLeadToExact: (...a: unknown[]) => pushLeadMock(...a),
}))
vi.mock('@/lib/sendgrid', () => ({ sendMail: (...a: unknown[]) => sendMailMock(...a) }))
vi.mock('@/lib/ads/conversoes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/ads/conversoes')>()),
  lerConfigAds: () => ({
    login: '1',
    customer: '2',
    acaoProposta: '999',
    subject: 'a@b',
    saJson: '{}',
  }),
  obterTokenAds: async () => 'token-ads',
  ingerirConversoes: (...a: unknown[]) => ingerirMock(...a),
}))
vi.mock('next/headers', () => ({
  headers: async () => ({ get: (nome: string) => (nome === 'x-forwarded-for' ? ipAtual : null) }),
  cookies: async () => ({
    get: (nome: string) => (jar.has(nome) ? { name: nome, value: jar.get(nome) } : undefined),
    set: (nome: string, valor: string, opcoes: unknown) => {
      jar.set(nome, valor)
      setCookieMock(nome, valor, opcoes)
    },
    delete: (opcoes: { name: string }) => {
      jar.delete(opcoes.name)
      deleteCookieMock(opcoes)
    },
  }),
}))

const { enviarEtapa1, enviarEtapa2, enviarPropostaCompleta } = await import(
  '@/app/(site)/_actions/proposta-duas-etapas'
)

// ---- banco em memória -----------------------------------------------------------------------
type LinhaFalsa = LinhaDoLead & { token: string | null; envioEm: Date | null; criadaEm: Date }
let tabela: LinhaFalsa[] = []
let proximoId = 501
let falharGravacao = false

// `as`: os parâmetros do pg chegam como unknown[]; nestes SQLs a ordem e o tipo são os da action.
const texto = (v: unknown) => v as string
const objeto = (v: unknown) => v as Record<string, string>

function visivel(l: LinhaFalsa): LinhaDoLead {
  const { token: _t, envioEm: _e, criadaEm: _c, ...resto } = l
  return { ...resto, data: { ...l.data } }
}

function pendente(token: unknown, com30min: boolean): LinhaFalsa | undefined {
  return tabela.find(
    (l) =>
      l.token === token &&
      l.etapa === 1 &&
      l.envioEm === null &&
      (!com30min || Date.now() - l.criadaEm.getTime() < 30 * 60_000),
  )
}

function semEmail(data: Record<string, string>): Record<string, string> {
  const { email: _e, ...resto } = data
  return resto
}

function nova(p: unknown[], etapa: 1 | 2, token: string | null): LinhaFalsa {
  const l: LinhaFalsa = {
    id: String(proximoId++),
    form: 'proposta',
    etapa,
    data: objeto(p[0]),
    gclid: (p[1] as string | null) ?? null,
    ads_consent: texto(p[3]),
    notificado_para: texto(p[4]),
    created_at: new Date(),
    token,
    envioEm: etapa === 1 ? null : new Date(),
    criadaEm: new Date(),
  }
  tabela.push(l)
  return l
}

/** O INSERT completo e, no mesmo comando, a etapa 1 órfã da mesma pessoa marcada como substituída. */
function inserirSubstituindo(p: unknown[]): LinhaFalsa {
  const orfas = tabela.filter(
    (l) =>
      l.etapa === 1 &&
      l.envioEm === null &&
      l.data.telefone === objeto(p[0]).telefone &&
      l.data.ambiente === objeto(p[0]).ambiente &&
      Date.now() - l.criadaEm.getTime() < 2 * 60 * 60_000,
  )
  const novo = nova(p, 2, null)
  for (const l of orfas) {
    l.envioEm = new Date()
    l.data = { ...l.data, substituida_por: novo.id }
  }
  return novo
}

async function banco(sql: string, p: unknown[] = []) {
  if (falharGravacao && /proposta:/.test(sql)) throw new Error('connect ECONNREFUSED')
  if (sql.includes('proposta:inserir-etapa1'))
    return { rows: [{ id: nova(p, 1, texto(p[5])).id }], rowCount: 1 }
  if (sql.includes('proposta:inserir-completa'))
    return { rows: [visivel(inserirSubstituindo(p))], rowCount: 1 }
  if (sql.includes('proposta:atualizar-etapa1') || sql.includes('proposta:reaproveitar-etapa1')) {
    const l = pendente(p[0], sql.includes('atualizar-etapa1'))
    if (!l) return { rows: [], rowCount: 0 }
    l.data = { ...semEmail(l.data), ...objeto(p[1]) }
    l.notificado_para = texto(p[3])
    return { rows: [], rowCount: 1 }
  }
  if (sql.includes('proposta:concluir-etapa2') || sql.includes('proposta:absorver')) {
    const l = pendente(p[0], sql.includes('concluir-etapa2'))
    if (!l) return { rows: [], rowCount: 0 }
    l.data = sql.includes('absorver')
      ? { ...semEmail(l.data), ...objeto(p[1]) }
      : { ...l.data, ...objeto(p[1]) }
    if (sql.includes('absorver')) l.notificado_para = texto(p[3])
    l.etapa = 2
    l.envioEm = new Date()
    return { rows: [visivel(l)], rowCount: 1 }
  }
  return { rows: [], rowCount: 1 }
}

function sqlCom(etiqueta: string): [string, unknown[]][] {
  return queryMock.mock.calls.filter(([sql]) => String(sql).includes(etiqueta)) as [
    string,
    unknown[],
  ][]
}
function inserts(): number {
  return sqlCom('proposta:inserir-etapa1').length + sqlCom('proposta:inserir-completa').length
}

const ETAPA1 = {
  nomeCondominio: 'Aurora',
  uf: 'PB',
  telefone: '(83) 99950-1388',
  email: 'maria@example.com',
}
const ETAPA2 = {
  nome: 'Maria',
  perfil: 'sindico',
  cidade: 'Campina Grande',
  unidades: '120',
  cliente: 'nao',
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

async function etapa1Gravada(): Promise<string> {
  expect(await enviarEtapa1(ETAPA1, 'turnstile-ok')).toEqual({ ok: true, etapa: 1 })
  const token = jar.get('proposta_etapa')
  if (!token) throw new Error('cookie da etapa não foi gravado')
  return token
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('VERCEL_ENV', 'production')
  tabela = []
  falharGravacao = false
  jar.clear()
  ipAtual = `203.0.113.${++contadorDeIp}`
  queryMock.mockImplementation(banco)
  verifyTurnstileMock.mockResolvedValue(true)
  pushLeadMock.mockResolvedValue({ ok: true, exactLeadId: 777 })
  sendMailMock.mockResolvedValue({ ok: true })
  ingerirMock.mockResolvedValue({ ok: true, status: 200, resposta: '{}' })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('etapa 1', () => {
  it('grava UMA linha com etapa 1 e envio_em nulo, token num cookie HttpOnly, e nada sai', async () => {
    await etapa1Gravada()
    expect(inserts()).toBe(1)
    const [sql, p] = sqlCom('proposta:inserir-etapa1')[0] ?? ['', []]
    expect(sql).toMatch(/values \('proposta', \$1, \$2, \$3, \$4, \$5, 1, \$6, null\)/)
    expect(p[0]).toMatchObject({
      nomeCondominio: 'Aurora',
      uf: 'PB',
      telefone: '+5583999501388',
      variante: 'duas-etapas',
      ambiente: 'production',
    })
    expect(p[4]).toBe('comercial.pb@semog.com.br')
    expect(texto(p[5])).toMatch(UUID)
    expect(setCookieMock).toHaveBeenCalledWith(
      'proposta_etapa',
      p[5],
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: true,
        maxAge: 7200,
      }),
    )
    expect(pushLeadMock).not.toHaveBeenCalled()
    expect(sendMailMock).not.toHaveBeenCalled()
    expect(ingerirMock).not.toHaveBeenCalled()
  })

  it('Turnstile recusado não grava', async () => {
    verifyTurnstileMock.mockResolvedValue(false)
    expect(await enviarEtapa1(ETAPA1, 'turnstile-ruim')).toMatchObject({
      ok: false,
      motivo: 'recusado',
    })
    expect(inserts()).toBe(0)
  })

  it('sem Turnstile e sem cookie: precisa_verificar, sem gravar (R5)', async () => {
    expect(await enviarEtapa1(ETAPA1, null)).toEqual({ ok: false, motivo: 'precisa_verificar' })
    expect(inserts()).toBe(0)
    expect(verifyTurnstileMock).not.toHaveBeenCalled()
  })

  it('campos inválidos não tocam o banco nem o Turnstile', async () => {
    const r = await enviarEtapa1({ ...ETAPA1, telefone: '123' }, 'turnstile-ok')
    expect(r).toMatchObject({
      ok: false,
      motivo: 'campos',
      erros: { telefone: expect.any(String) },
    })
    expect(queryMock).not.toHaveBeenCalled()
    expect(verifyTurnstileMock).not.toHaveBeenCalled()
  })

  it('voltar: reenviar a etapa 1 com o cookie válido atualiza a MESMA linha, sem Turnstile (R6)', async () => {
    const token = await etapa1Gravada()
    verifyTurnstileMock.mockClear()
    expect(await enviarEtapa1({ ...ETAPA1, uf: 'PE', email: '' }, null)).toEqual({
      ok: true,
      etapa: 1,
    })
    expect(inserts()).toBe(1)
    expect(verifyTurnstileMock).not.toHaveBeenCalled()
    const [sql, p] = sqlCom('proposta:atualizar-etapa1')[0] ?? ['', []]
    expect(p[0]).toBe(token)
    expect(sql).toMatch(/token_envio = \$1 and etapa = 1 and envio_em is null/)
    expect(sql).toContain("created_at > now() - interval '30 minutes'")
    // UF trocada ao voltar (Review Focus): o destino do e-mail acompanha, e o e-mail apagado sai.
    expect(tabela[0]?.notificado_para).toBe('ivan@semog.com.br')
    expect(tabela[0]?.data.email).toBeUndefined()
  })

  it('voltar depois dos 30 min: o UPDATE não acha a linha; sem Turnstile, precisa_verificar', async () => {
    await etapa1Gravada()
    const linha = tabela[0]
    if (linha) linha.criadaEm = new Date(Date.now() - 31 * 60_000)
    expect(await enviarEtapa1(ETAPA1, null)).toEqual({ ok: false, motivo: 'precisa_verificar' })
    expect(inserts()).toBe(1)
  })

  it('voltar depois dos 30 min com Turnstile novo: UPDATE da MESMA linha, nenhum INSERT', async () => {
    const token = await etapa1Gravada()
    const linha = tabela[0]
    const criadaEm = new Date(Date.now() - 31 * 60_000)
    if (linha) linha.criadaEm = criadaEm
    expect(await enviarEtapa1({ ...ETAPA1, uf: 'PE' }, 'turnstile-novo')).toEqual({
      ok: true,
      etapa: 1,
    })
    expect(inserts()).toBe(1)
    expect(tabela).toHaveLength(1)
    const [sql, p] = sqlCom('proposta:reaproveitar-etapa1')[0] ?? ['', []]
    expect(p[0]).toBe(token)
    expect(sql).toMatch(/token_envio = \$1 and etapa = 1 and envio_em is null/)
    expect(sql).not.toContain('30 minutes')
    // `created_at` fica: o cron mede os 45 min a partir dele.
    expect(sql).not.toContain('created_at')
    expect(tabela[0]?.criadaEm).toBe(criadaEm)
    expect(tabela[0]?.notificado_para).toBe('ivan@semog.com.br')
    expect(jar.get('proposta_etapa')).toBe(token)
  })

  it('linha já reivindicada pelo cron: com Turnstile novo grava UMA linha nova e troca o cookie', async () => {
    const token = await etapa1Gravada()
    const linha = tabela[0]
    if (linha) {
      linha.criadaEm = new Date(Date.now() - 46 * 60_000)
      linha.envioEm = new Date()
    }
    expect(await enviarEtapa1(ETAPA1, 'turnstile-novo')).toEqual({ ok: true, etapa: 1 })
    expect(sqlCom('proposta:reaproveitar-etapa1')).toHaveLength(1)
    expect(inserts()).toBe(2)
    expect(tabela).toHaveLength(2)
    const novo = jar.get('proposta_etapa')
    expect(novo).toMatch(UUID)
    expect(novo).not.toBe(token)
    expect(tabela[1]?.token).toBe(novo)
  })
})

describe('etapa 2', () => {
  it('conclui a mesma linha pelo token, dentro de 30 min: uma linha por lead, envios uma vez, cookie apagado', async () => {
    await etapa1Gravada()
    expect(await enviarEtapa2(ETAPA2)).toEqual({ ok: true, etapa: 2 })

    expect(inserts()).toBe(1)
    const [sql, p] = sqlCom('proposta:concluir-etapa2')[0] ?? ['', []]
    expect(sql).toMatch(/set data = data \|\| \$2::jsonb, etapa = 2, envio_em = now\(\)/)
    expect(sql).toMatch(/token_envio = \$1 and etapa = 1 and envio_em is null/)
    expect(sql).toContain("created_at > now() - interval '30 minutes'")
    expect(p[1]).toEqual({
      nome: 'Maria',
      cargo: 'Síndico(a)',
      cidade: 'Campina Grande',
      unidades: '120',
      cliente: 'nao',
    })
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
    expect(pushLeadMock.mock.calls[0]?.[1]).toMatchObject({
      nomeCondominio: 'Aurora',
      nome: 'Maria',
      etapa: '2',
    })
    expect(sendMailMock).toHaveBeenCalledTimes(2)
    expect(ingerirMock).toHaveBeenCalledTimes(0) // sem gclid no cookie de atribuição
    expect(deleteCookieMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'proposta_etapa' }),
    )
    expect(tabela).toHaveLength(1)
  })

  it('a mesma etapa 2 repetida não envia de novo (uso único)', async () => {
    const token = await etapa1Gravada()
    await enviarEtapa2(ETAPA2)
    jar.set('proposta_etapa', token)
    expect(await enviarEtapa2(ETAPA2)).toEqual({ ok: false, motivo: 'precisa_verificar' })
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
  })

  it('sem cookie: precisa_verificar e nada gravado (R5)', async () => {
    expect(await enviarEtapa2(ETAPA2)).toEqual({ ok: false, motivo: 'precisa_verificar' })
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('cookie com valor adulterado vale como ausente', async () => {
    jar.set('proposta_etapa', 'nao-e-uuid')
    expect(await enviarEtapa2(ETAPA2)).toEqual({ ok: false, motivo: 'precisa_verificar' })
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('já é cliente: nem Exact nem Ads; o e-mail avisa que é cliente', async () => {
    await etapa1Gravada()
    await enviarEtapa2({ ...ETAPA2, cliente: 'sim' })
    expect(pushLeadMock).not.toHaveBeenCalled()
    expect(ingerirMock).not.toHaveBeenCalled()
    // `as`: o mock recebe o argumento de `sendMail` como unknown; só o assunto interessa aqui.
    const envio = sendMailMock.mock.calls[0]?.[0] as { subject?: string } | undefined
    expect(envio?.subject).toContain('já é cliente')
  })
})

describe('token perdido ou vencido: proposta completa com Turnstile (R5)', () => {
  it('entre 30 e 45 min: precisa_verificar e depois conclui a MESMA linha (Review Focus)', async () => {
    await etapa1Gravada()
    const linha = tabela[0]
    if (linha) linha.criadaEm = new Date(Date.now() - 35 * 60_000)
    expect(await enviarEtapa2(ETAPA2)).toEqual({ ok: false, motivo: 'precisa_verificar' })
    expect(await enviarPropostaCompleta({ ...ETAPA1, ...ETAPA2 }, 'turnstile-novo')).toEqual({
      ok: true,
      etapa: 2,
    })
    expect(tabela).toHaveLength(1)
    expect(inserts()).toBe(1)
    const [sql] = sqlCom('proposta:absorver')[0] ?? ['']
    expect(sql).not.toContain('30 minutes')
    expect(sql).toMatch(/envio_em is null/)
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
    expect(deleteCookieMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'proposta_etapa' }),
    )
    expect(jar.has('proposta_etapa')).toBe(false)
  })

  it('sem cookie: grava UMA linha nova completa com etapa 2', async () => {
    expect(await enviarPropostaCompleta({ ...ETAPA1, ...ETAPA2 }, 'turnstile-novo')).toEqual({
      ok: true,
      etapa: 2,
    })
    expect(sqlCom('proposta:inserir-completa')).toHaveLength(1)
    // Nasce reivindicada de forma explícita (`envio_em = now()` no próprio INSERT), sem depender
    // do default da coluna: o pós-gravação só roda com linha reivindicada (contrato da 2.3).
    expect(String(sqlCom('proposta:inserir-completa')[0]?.[0])).toMatch(
      /\$5, 2, now\(\)\) returning/,
    )
    expect(tabela[0]?.data).toMatchObject({
      nomeCondominio: 'Aurora',
      nome: 'Maria',
      ambiente: 'production',
    })
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
  })

  it('sem Turnstile nunca grava', async () => {
    expect(await enviarPropostaCompleta({ ...ETAPA1, ...ETAPA2 }, '')).toEqual({
      ok: false,
      motivo: 'precisa_verificar',
    })
    verifyTurnstileMock.mockResolvedValue(false)
    expect(await enviarPropostaCompleta({ ...ETAPA1, ...ETAPA2 }, 'ruim')).toMatchObject({
      ok: false,
      motivo: 'recusado',
    })
    expect(inserts()).toBe(0)
  })
})

describe('ambiente e falhas', () => {
  it('Preview grava com ambiente preview e nada sai, nem na etapa 2 (R1)', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    await etapa1Gravada()
    expect(tabela[0]?.data.ambiente).toBe('preview')
    expect(await enviarEtapa2(ETAPA2)).toEqual({ ok: true, etapa: 2 })
    expect(pushLeadMock).not.toHaveBeenCalled()
    expect(sendMailMock).not.toHaveBeenCalled()
    expect(ingerirMock).not.toHaveBeenCalled()
  })

  it('local (sem VERCEL_ENV) também não envia', async () => {
    vi.stubEnv('VERCEL_ENV', '')
    vi.stubEnv('VERCEL', '')
    await etapa1Gravada()
    expect(tabela[0]?.data.ambiente).toBe('local')
    await enviarEtapa2(ETAPA2)
    expect(pushLeadMock).not.toHaveBeenCalled()
  })

  it('falha de gravação devolve "falha" tipado, nunca lança, e vai ao Sentry sem dado pessoal (R8)', async () => {
    falharGravacao = true
    const r = await enviarEtapa1(ETAPA1, 'turnstile-ok')
    expect(r).toMatchObject({ ok: false, motivo: 'falha' })
    expect(captureExceptionMock).toHaveBeenCalledTimes(1)
    const evento = JSON.stringify(captureExceptionMock.mock.calls[0]?.[1])
    expect(evento).toContain('gravacao')
    for (const pessoal of ['99950', 'maria@', 'Aurora']) expect(evento).not.toContain(pessoal)
  })

  it('Ads que falha não derruba o Exact nem a resposta (D1)', async () => {
    jar.set(
      'semog-attrib',
      encodeURIComponent(JSON.stringify({ first: { gclid: 'GCLID-1' }, last: {} })),
    )
    ingerirMock.mockRejectedValue(new Error('500'))
    await etapa1Gravada()
    expect(await enviarEtapa2(ETAPA2)).toEqual({ ok: true, etapa: 2 })
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: expect.objectContaining({ passo: 'ads' }) }),
    )
  })

  it('Ads com gclid sobe uma vez com transactionId lead-<id>', async () => {
    jar.set(
      'semog-attrib',
      encodeURIComponent(JSON.stringify({ first: { gclid: 'GCLID-1' }, last: {} })),
    )
    await etapa1Gravada()
    await enviarEtapa2(ETAPA2)
    expect(ingerirMock).toHaveBeenCalledTimes(1)
    const eventos = ingerirMock.mock.calls[0]?.[3] as { transactionId: string }[]
    expect(eventos[0]?.transactionId).toBe(`lead-${tabela[0]?.id}`)
  })
})

describe('rate limit por IP (DP11)', () => {
  // A cota é o `rateLimit` real (em memória). Gastá-la por fora, com a chave exata, trava o nome da
  // chave e o teto: chave ou teto trocados na action fazem estes testes falharem.
  const gastar = (chave: string, vezes: number, max: number) => {
    for (let i = 0; i < vezes; i++) rateLimit(chave, { max, windowMs: 60_000 })
  }
  const MUITAS = {
    ok: false,
    motivo: 'recusado',
    mensagem: 'Muitas tentativas, tente em instantes.',
  }

  it('etapa 1 e envio completo dividem `proposta:<ip>` (a do formulário antigo), 5 por minuto', async () => {
    gastar(`proposta:${ipAtual}`, 4, 5)
    expect(await enviarEtapa1(ETAPA1, null)).toEqual({ ok: false, motivo: 'precisa_verificar' })
    expect(await enviarPropostaCompleta({ ...ETAPA1, ...ETAPA2 }, 'turnstile-ok')).toEqual(MUITAS)
    expect(await enviarEtapa1(ETAPA1, 'turnstile-ok')).toEqual(MUITAS)
    expect(verifyTurnstileMock).not.toHaveBeenCalled()
    expect(inserts()).toBe(0)
  })

  it('etapa 2 tem cota própria `proposta-etapa2:<ip>`, 10 por minuto', async () => {
    gastar(`proposta:${ipAtual}`, 5, 5)
    gastar(`proposta-etapa2:${ipAtual}`, 9, 10)
    expect(await enviarEtapa2(ETAPA2)).toEqual({ ok: false, motivo: 'precisa_verificar' })
    expect(await enviarEtapa2(ETAPA2)).toEqual(MUITAS)
  })
})

describe('cookie que falha não desfaz a gravação', () => {
  const tagsDoCookie = expect.objectContaining({
    tags: expect.objectContaining({ passo: 'cookie' }),
  })

  it('apagar o cookie lança depois da reivindicação: pós-gravação roda uma vez e é sucesso', async () => {
    await etapa1Gravada()
    deleteCookieMock.mockImplementation(() => {
      throw new Error('cookie')
    })
    expect(await enviarEtapa2(ETAPA2)).toEqual({ ok: true, etapa: 2 })
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
    expect(sendMailMock).toHaveBeenCalledTimes(2)
    expect(captureExceptionMock).toHaveBeenCalledWith(expect.any(Error), tagsDoCookie)
  })

  it('no envio completo, idem: a linha absorvida é enviada uma vez', async () => {
    await etapa1Gravada()
    deleteCookieMock.mockImplementation(() => {
      throw new Error('cookie')
    })
    expect(await enviarPropostaCompleta({ ...ETAPA1, ...ETAPA2 }, 'turnstile-novo')).toEqual({
      ok: true,
      etapa: 2,
    })
    expect(tabela).toHaveLength(1)
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
    expect(captureExceptionMock).toHaveBeenCalledWith(expect.any(Error), tagsDoCookie)
  })

  it('gravar o cookie lança depois do INSERT da etapa 1: sucesso, uma linha, Sentry', async () => {
    setCookieMock.mockImplementation(() => {
      throw new Error('cookie')
    })
    expect(await enviarEtapa1(ETAPA1, 'turnstile-ok')).toEqual({ ok: true, etapa: 1 })
    expect(inserts()).toBe(1)
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: expect.objectContaining({ passo: 'cookie', origem: 'etapa1' }),
      }),
    )
  })
})

describe('cookie perdido: a etapa 1 órfã é substituída pela proposta completa (Rodada 3)', () => {
  function sqlDoInsertCompleto(): string {
    return String(sqlCom('proposta:inserir-completa')[0]?.[0] ?? '')
  }

  it('o INSERT e a marcação são UM comando, com o critério exato da órfã', async () => {
    await enviarPropostaCompleta({ ...ETAPA1, ...ETAPA2 }, 'turnstile-novo')
    const sql = sqlDoInsertCompleto()
    expect(sqlCom('proposta:')).toHaveLength(1)
    expect(sql).toMatch(/with novo as \(\s*insert into cms\.leads/)
    expect(sql).toContain("jsonb_build_object('substituida_por', novo.id::text)")
    expect(sql).toMatch(/set envio_em = now\(\)/)
    expect(sql).toContain("l.form = 'proposta' and l.etapa = 1 and l.envio_em is null")
    expect(sql).toContain("l.data->>'telefone' = novo.data->>'telefone'")
    expect(sql).toContain("l.data->>'ambiente' = novo.data->>'ambiente'")
    expect(sql).toContain("l.created_at > now() - interval '2 hours'")
    expect(sql).toMatch(/select id, form, etapa, data, .* from novo/)
  })

  it('etapa 1 do mesmo telefone, cookie sumido: vira substituída e só a linha nova é enviada', async () => {
    await etapa1Gravada()
    jar.clear()
    expect(await enviarPropostaCompleta({ ...ETAPA1, ...ETAPA2 }, 'turnstile-novo')).toEqual({
      ok: true,
      etapa: 2,
    })
    expect(tabela).toHaveLength(2)
    expect(tabela[0]?.envioEm).not.toBeNull()
    expect(tabela[0]?.data.substituida_por).toBe(tabela[1]?.id)
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
    expect(pushLeadMock.mock.calls[0]?.[1]).toMatchObject({ nome: 'Maria', etapa: '2' })
  })

  it('etapa 1 de outro telefone continua pendente', async () => {
    await etapa1Gravada()
    jar.clear()
    await enviarPropostaCompleta(
      { ...ETAPA1, ...ETAPA2, telefone: '(81) 98888-7777' },
      'turnstile-novo',
    )
    expect(tabela[0]?.envioEm).toBeNull()
    expect(tabela[0]?.data.substituida_por).toBeUndefined()
  })
})
