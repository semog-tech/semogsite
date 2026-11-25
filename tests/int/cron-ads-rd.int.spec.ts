import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Cron `upload-ads-conversions`, lote dos marcos do RD CRM ("RD - Proposta
 * enviada" e "RD - Ganho"). Mesmo arranjo de `cron-ads.int.spec.ts`: `@/lib/db`,
 * `google-auth-library` e o `fetch` são falsos, e o resto do caminho é o real.
 *
 * Aqui o `query` responde pelo texto do SQL, não pela ordem: o lote RD lê
 * antes do token e grava depois dos outros dois.
 */

const queryMock = vi.fn()
const authorizeMock = vi.fn()
const fetchMock = vi.fn()

vi.mock('server-only', () => ({}))

vi.mock('@/lib/db', () => ({
  query: (...args: unknown[]) => queryMock(...args),
}))

vi.mock('google-auth-library', () => ({
  JWT: class {
    authorize() {
      return authorizeMock()
    }
  },
}))

const { GET } = await import('@/app/api/cron/upload-ads-conversions/route')
const { selecionarMarcosRd } = await import('@/lib/conversoesRd')

const ENV_VARS = {
  CRON_SECRET: 'segredo-de-teste',
  GOOGLE_ADS_LOGIN_CUSTOMER_ID: '1112223333',
  GOOGLE_ADS_CUSTOMER_ID: '4445556666',
  GOOGLE_ADS_CONVERSION_ACTION_ID: '999',
  GOOGLE_ADS_IMPERSONATED_EMAIL: 'sa-impersonado@semog.com.br',
  GOOGLE_SA_JSON: JSON.stringify({
    client_email: 'fake@fake.iam.gserviceaccount.com',
    private_key: 'chave-fake',
  }),
} as const

const PROPOSTA_ENV = 'GOOGLE_ADS_RD_PROPOSTA_CONVERSION_ACTION_ID'
const GANHO_ENV = 'GOOGLE_ADS_RD_GANHO_CONVERSION_ACTION_ID'
const DIA = 24 * 60 * 60 * 1000

function fakeRequest(): Request {
  const headers = new Headers({ authorization: `Bearer ${ENV_VARS.CRON_SECRET}` })
  return new Request('http://localhost/api/cron/upload-ads-conversions', { headers })
}

/** Lead criado há 10 dias, com proposta 2 dias depois e ganho 5 dias depois. */
function linhaRd(extra: Record<string, unknown> = {}) {
  const criado = Date.now() - 10 * DIA
  return {
    id: '42',
    created_at: new Date(criado).toISOString(),
    gclid: 'Cj0KCQjw-fake-gclid',
    tipo_de_clique: null,
    ads_consent: 'granted',
    proposta_enviada_em: new Date(criado + 2 * DIA),
    ganho_em: new Date(criado + 5 * DIA),
    enviados: [],
    ...extra,
  }
}

type Banco = {
  leads?: unknown[]
  whatsapp?: unknown[]
  marcos?: unknown[] | Error
}

/** Responde cada consulta pelo SQL; gravações devolvem vazio. */
function banco({ leads = [], whatsapp = [], marcos = [] }: Banco) {
  queryMock.mockImplementation(async (sql: string) => {
    if (/crm_rdstation_marcos_obter/.test(sql)) {
      if (marcos instanceof Error) throw marcos
      return { rows: marcos }
    }
    if (/^\s*select[\s\S]*from cms\.leads/i.test(sql)) return { rows: leads }
    if (/from cms\.whatsapp_clicks/i.test(sql)) return { rows: whatsapp }
    return { rows: [] }
  })
}

function chamadas(padrao: RegExp) {
  return queryMock.mock.calls.filter(([sql]) => padrao.test(sql as string)) as [string, unknown[]][]
}

type Corpo = {
  destinations: { productDestinationId: string }[]
  events: {
    transactionId: string
    eventTimestamp: string
    adIdentifiers: Record<string, string>
    consent: { adUserData: string }
  }[]
}

function corpos(): Corpo[] {
  return fetchMock.mock.calls.map(([, opts]) => JSON.parse((opts as RequestInit).body as string))
}

function corpoDa(destino: string): Corpo | undefined {
  return corpos().find((c) => c.destinations[0].productDestinationId === destino)
}

type Resposta = {
  ok: boolean
  leads: { considered: number; ok: boolean }
  rd: Record<string, { considered: number; ok: boolean; skipped?: string }>
}

describe('cron upload-ads-conversions: marcos do RD CRM', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    for (const [k, v] of Object.entries(ENV_VARS)) process.env[k] = v
    process.env[PROPOSTA_ENV] = '111'
    process.env[GANHO_ENV] = '222'
    delete process.env.GOOGLE_ADS_WHATSAPP_CONVERSION_ACTION_ID
    authorizeMock.mockResolvedValue({ access_token: 'access-token-fake' })
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ requestId: 'r' }) })
  })

  afterEach(() => {
    for (const k of Object.keys(ENV_VARS)) delete process.env[k]
    delete process.env[PROPOSTA_ENV]
    delete process.env[GANHO_ENV]
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('sobe cada marco na sua ação, com a data real do marco e transactionId próprio', async () => {
    const linha = linhaRd()
    banco({ marcos: [linha] })

    const res = await GET(fakeRequest())
    const json = (await res.json()) as Resposta

    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(json.rd.proposta_enviada.considered).toBe(1)
    expect(json.rd.ganho.considered).toBe(1)

    const proposta = corpoDa('111')
    const ganho = corpoDa('222')
    expect(proposta?.events).toHaveLength(1)
    expect(proposta?.events[0].eventTimestamp).toBe(linha.proposta_enviada_em.toISOString())
    expect(proposta?.events[0].transactionId).toBe('rd-proposta-42')
    expect(proposta?.events[0].adIdentifiers).toEqual({ gclid: linha.gclid })
    expect(ganho?.events[0].eventTimestamp).toBe(linha.ganho_em.toISOString())
    expect(ganho?.events[0].transactionId).toBe('rd-ganho-42')
    // A ação do formulário não recebe marco nenhum.
    expect(corpoDa('999')).toBeUndefined()
  })

  it('lead só com proposta: sobe a proposta e não o ganho', async () => {
    banco({ marcos: [linhaRd({ ganho_em: null })] })

    const json = (await (await GET(fakeRequest())).json()) as Resposta

    expect(corpoDa('111')?.events).toHaveLength(1)
    expect(corpoDa('222')).toBeUndefined()
    expect(json.rd.ganho.considered).toBe(0)
  })

  it('registra o envio em cms.ads_conversoes_rd só depois do OK do Google, um INSERT por marco', async () => {
    const linha = linhaRd()
    banco({ marcos: [linha] })

    await GET(fakeRequest())

    const inserts = chamadas(/insert into cms\.ads_conversoes_rd/i)
    expect(inserts).toHaveLength(2)
    const [sql, params] = inserts[0]
    expect(sql).toMatch(/on conflict \(lead_id, marco\) do nothing/i)
    expect(params).toEqual([['42'], 'proposta_enviada', [linha.proposta_enviada_em.toISOString()]])
    expect(inserts[1][1]).toEqual([['42'], 'ganho', [linha.ganho_em.toISOString()]])
    // Nada do RD mexe em uploaded_to_ads.
    expect(chamadas(/uploaded_to_ads = true/i)).toHaveLength(0)
  })

  it('Google recusa: não registra, e o marco volta amanhã', async () => {
    banco({ marcos: [linhaRd()] })
    fetchMock.mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: 'x' }) })

    const json = (await (await GET(fakeRequest())).json()) as Resposta

    expect(json.ok).toBe(false)
    expect(json.rd.proposta_enviada.ok).toBe(false)
    expect(chamadas(/insert into cms\.ads_conversoes_rd/i)).toHaveLength(0)
  })

  it('deduplicação: marco já registrado não sobe de novo', async () => {
    banco({ marcos: [linhaRd({ enviados: ['proposta_enviada'] })] })

    const json = (await (await GET(fakeRequest())).json()) as Resposta

    expect(corpoDa('111')).toBeUndefined()
    expect(corpoDa('222')?.events).toHaveLength(1)
    expect(json.rd.proposta_enviada.considered).toBe(0)
    const inserts = chamadas(/insert into cms\.ads_conversoes_rd/i)
    expect(inserts).toHaveLength(1)
    expect(inserts[0][1][1]).toBe('ganho')
  })

  it('deduplicação: os dois marcos registrados, nada sobe e nem pede token', async () => {
    banco({ marcos: [linhaRd({ enviados: ['proposta_enviada', 'ganho'] })] })

    await GET(fakeRequest())

    expect(fetchMock).not.toHaveBeenCalled()
    expect(authorizeMock).not.toHaveBeenCalled()
  })

  it('o SELECT traz o que já subiu de cms.ads_conversoes_rd e só lead com gclid', async () => {
    banco({})

    await GET(fakeRequest())

    const [[sql]] = chamadas(/crm_rdstation_marcos_obter/)
    expect(sql).toMatch(/from cms\.ads_conversoes_rd c where c\.lead_id = l\.id/i)
    expect(sql).toMatch(/l\.gclid is not null/i)
  })

  it('janela de 90 dias: o corte do SELECT é a criação do lead há 90 dias', async () => {
    banco({})
    const antes = Date.now()

    await GET(fakeRequest())

    const [[sql, params]] = chamadas(/crm_rdstation_marcos_obter/)
    expect(sql).toMatch(/l\.created_at > \$1/)
    const corte = new Date(params[0] as string).getTime()
    expect(corte).toBeGreaterThanOrEqual(antes - 90 * DIA - 1000)
    expect(corte).toBeLessThanOrEqual(Date.now() - 90 * DIA)
  })

  it('janela de 90 dias: marco depois de 90 dias da criação do lead não sobe', async () => {
    const criado = Date.now() - 89 * DIA
    // O SELECT corta pela criação; o marco ainda é conferido contra a janela.
    const dentro = linhaRd({
      id: '1',
      created_at: new Date(criado).toISOString(),
      proposta_enviada_em: new Date(criado + 89 * DIA),
      ganho_em: null,
    })
    const fora = linhaRd({
      id: '2',
      created_at: new Date(criado).toISOString(),
      proposta_enviada_em: new Date(criado + 91 * DIA),
      ganho_em: null,
    })
    banco({ marcos: [dentro, fora] })

    await GET(fakeRequest())

    const proposta = corpoDa('111')
    expect(proposta?.events.map((e) => e.transactionId)).toEqual(['rd-proposta-1'])
  })

  it('sem gclid não sobe', async () => {
    banco({ marcos: [linhaRd({ gclid: null }), linhaRd({ id: '43', gclid: '' })] })

    const json = (await (await GET(fakeRequest())).json()) as Resposta

    expect(fetchMock).not.toHaveBeenCalled()
    expect(json.rd.proposta_enviada.considered).toBe(0)
    expect(chamadas(/insert into cms\.ads_conversoes_rd/i)).toHaveLength(0)
  })

  it('sem as duas variáveis: não consulta marcos, não sobe nada e registra no log', async () => {
    delete process.env[PROPOSTA_ENV]
    delete process.env[GANHO_ENV]
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    banco({ marcos: [linhaRd()] })

    const res = await GET(fakeRequest())
    const json = (await res.json()) as Resposta

    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(chamadas(/crm_rdstation_marcos_obter/)).toHaveLength(0)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(json.rd.proposta_enviada.skipped).toMatch(PROPOSTA_ENV)
    expect(json.rd.ganho.skipped).toMatch(GANHO_ENV)
    const logs = info.mock.calls.map(([m]) => String(m)).join('\n')
    expect(logs).toContain(PROPOSTA_ENV)
    expect(logs).toContain(GANHO_ENV)
  })

  it('só a variável do ganho ausente: a proposta sobe e o ganho fica pendente', async () => {
    delete process.env[GANHO_ENV]
    vi.spyOn(console, 'info').mockImplementation(() => {})
    banco({ marcos: [linhaRd()] })

    const json = (await (await GET(fakeRequest())).json()) as Resposta

    expect(corpos()).toHaveLength(1)
    expect(corpoDa('111')?.events).toHaveLength(1)
    expect(json.rd.ganho.skipped).toMatch(GANHO_ENV)
    const inserts = chamadas(/insert into cms\.ads_conversoes_rd/i)
    expect(inserts.map(([, p]) => p[1])).toEqual(['proposta_enviada'])
  })

  it('erro ao ler os marcos (fachada ausente) não derruba o upload dos leads', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    banco({
      leads: [{ id: '7', created_at: '2026-11-20T12:00:00.000Z', gclid: 'g', ads_consent: null }],
      marcos: new Error('function cms.crm_rdstation_marcos_obter() does not exist'),
    })

    const res = await GET(fakeRequest())
    const json = (await res.json()) as Resposta

    expect(res.status).toBe(200)
    expect(json.leads.ok).toBe(true)
    expect(json.rd.proposta_enviada.ok).toBe(false)
    expect(json.rd.proposta_enviada.skipped).toMatch(/does not exist/)
    expect(json.ok).toBe(false)
    expect(chamadas(/update cms\.leads set uploaded_to_ads = true/i)).toHaveLength(1)
  })

  it('consentimento vem da linha do lead, como nos outros lotes', async () => {
    banco({ marcos: [linhaRd({ ads_consent: 'denied' })] })

    await GET(fakeRequest())

    expect(corpoDa('111')?.events[0].consent.adUserData).toBe('CONSENT_DENIED')
  })
})

describe('selecionarMarcosRd', () => {
  it('marco anterior à criação do lead não sobe', () => {
    const criado = Date.now() - 5 * DIA
    const linha = linhaRd({
      created_at: new Date(criado).toISOString(),
      proposta_enviada_em: new Date(criado - DIA),
    })
    expect(selecionarMarcosRd([linha], 'proposta_enviada')).toEqual([])
  })

  it('marco ainda não alcançado não sobe', () => {
    expect(selecionarMarcosRd([linhaRd({ ganho_em: null })], 'ganho')).toEqual([])
  })

  it('aceita datas como texto, como o pg devolve em alguns caminhos', () => {
    const linha = linhaRd({ proposta_enviada_em: new Date(Date.now() - DIA).toISOString() })
    const [pendente] = selecionarMarcosRd([linha], 'proposta_enviada')
    expect(pendente.linha.id).toBe('42')
    expect(pendente.marcoEm.toISOString()).toBe(linha.proposta_enviada_em)
  })
})
