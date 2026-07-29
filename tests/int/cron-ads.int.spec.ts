import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Cron `upload-ads-conversions` (Fase 3/Task 4) reescrito pra ler `cms.leads`
 * via `pg` (`@/lib/db`) em vez de `payload.find` em `form-submissions`. Aqui
 * mockamos `@/lib/db` (query), `google-auth-library` (JWT) e o `fetch`
 * global (Data Manager API) pra exercitar o pipeline real (Bearer →
 * guarda de env vars do Google Ads → SELECT leads com gclid pendente →
 * upload → UPDATE `uploaded_to_ads`) sem tocar Postgres/Google de verdade.
 */

const queryMock = vi.fn()
const authorizeMock = vi.fn()
const fetchMock = vi.fn()

vi.mock('@/lib/db', () => ({
  query: (...args: unknown[]) => queryMock(...args),
}))

// Classe de verdade (não `vi.fn().mockImplementation(...)`) porque
// `vi.resetAllMocks()` no `beforeEach` limpa a implementação de qualquer
// `vi.fn()` — se `JWT` fosse um mock direto, o reset apagaria o
// `mockImplementation` e `new JWT(...)` viraria um objeto vazio sem
// `.authorize`. Só `authorizeMock` (reconfigurado a cada teste) é mock.
vi.mock('google-auth-library', () => ({
  JWT: class {
    authorize() {
      return authorizeMock()
    }
  },
}))

// Import só depois dos `vi.mock` acima (hoisted pelo Vitest).
const { GET } = await import('@/app/api/cron/upload-ads-conversions/route')

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

/** Fake `Request` só com o header `authorization` usado pela rota. */
function fakeRequest(bearer?: string): Request {
  const headers = new Headers()
  if (bearer !== undefined) headers.set('authorization', `Bearer ${bearer}`)
  return new Request('http://localhost/api/cron/upload-ads-conversions', { headers })
}

const leadComGclid = {
  id: '42',
  created_at: '2026-07-20T12:00:00.000Z',
  gclid: 'Cj0KCQjw-fake-gclid',
  email: 'lead@example.com',
}

describe('cron upload-ads-conversions — lê cms.leads via pg (sem Payload)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    for (const [k, v] of Object.entries(ENV_VARS)) process.env[k] = v
    authorizeMock.mockResolvedValue({ access_token: 'access-token-fake' })
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: 'ok' }),
    })
  })

  afterEach(() => {
    for (const k of Object.keys(ENV_VARS)) delete process.env[k]
    vi.unstubAllGlobals()
  })

  it('401 sem Bearer correto — não toca no banco nem no fetch', async () => {
    const res = await GET(fakeRequest('token-errado'))
    expect(res.status).toBe(401)
    expect(queryMock).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('401 sem header de autorização nenhum', async () => {
    const res = await GET(fakeRequest())
    expect(res.status).toBe(401)
  })

  it('500 quando faltam env vars do Google Ads (mesmo com Bearer correto)', async () => {
    delete process.env.GOOGLE_SA_JSON
    const res = await GET(fakeRequest(ENV_VARS.CRON_SECRET))
    expect(res.status).toBe(500)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('SELECT filtra gclid presente, form de captação e uploaded_to_ads=false', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })
    await GET(fakeRequest(ENV_VARS.CRON_SECRET))

    expect(queryMock).toHaveBeenCalledTimes(1)
    const [sql] = queryMock.mock.calls[0] as [string, unknown[]]
    expect(sql).toMatch(/gclid is not null/i)
    expect(sql).toMatch(/uploaded_to_ads\s*=\s*false/i)
    expect(sql).toMatch(/form\s*=\s*'proposta'/i)
  })

  it('SELECT inclui contato só quando assunto = proposta-comercial (atendimento fica de fora)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })
    await GET(fakeRequest(ENV_VARS.CRON_SECRET))

    const [sql] = queryMock.mock.calls[0] as [string, unknown[]]
    // O form "contato" é majoritariamente atendimento a quem já é cliente
    // (segunda via de boleto, CND, acordo…). Só pode entrar acompanhado do
    // filtro de assunto — nunca `form = 'contato'` sozinho.
    expect(sql).toMatch(/form\s*=\s*'contato'\s*and\s*data->>'assunto'\s*=\s*'proposta-comercial'/i)
    expect(sql).not.toMatch(/form\s*=\s*'contato'\s*\)/i)
  })

  it('sem leads com gclid pendente: não chama fetch nem UPDATE', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })
    const res = await GET(fakeRequest(ENV_VARS.CRON_SECRET))
    const json = (await res.json()) as { considered: number }

    expect(json.considered).toBe(0)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(queryMock).toHaveBeenCalledTimes(1) // só o SELECT, nenhum UPDATE
  })

  it('lead com gclid: sobe a conversão e só marca uploaded_to_ads=true depois do OK do Google', async () => {
    queryMock.mockResolvedValueOnce({ rows: [leadComGclid] }) // SELECT
    queryMock.mockResolvedValueOnce({ rows: [] }) // UPDATE

    const res = await GET(fakeRequest(ENV_VARS.CRON_SECRET))
    const json = (await res.json()) as { ok: boolean; considered: number }

    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(json.considered).toBe(1)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(options.body as string)
    expect(body.events).toHaveLength(1)
    expect(body.events[0].adIdentifiers.gclid).toBe(leadComGclid.gclid)
    expect(body.events[0].transactionId).toBe(String(leadComGclid.id))
    // eventTimestamp deriva do created_at do lead, não de Date.now().
    expect(body.events[0].eventTimestamp).toBe(new Date(leadComGclid.created_at).toISOString())

    // UPDATE só depois do upload confirmado — 2ª chamada de `query`, uma
    // única atualização em lote (`= any($1)`), não um UPDATE por lead.
    expect(queryMock).toHaveBeenCalledTimes(2)
    const [updateSql, updateParams] = queryMock.mock.calls[1] as [string, unknown[]]
    expect(updateSql).toMatch(/update cms\.leads/i)
    expect(updateSql).toMatch(/uploaded_to_ads\s*=\s*true/i)
    expect(updateSql).toMatch(/where id = any\(\$1(::bigint\[\])?\)/i)
    expect(updateParams).toHaveLength(1)
    expect(updateParams[0]).toEqual([leadComGclid.id])
  })

  it('Google recusa o upload (res.ok=false): NÃO marca uploaded_to_ads (retry natural amanhã)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [leadComGclid] })
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'invalid gclid' }),
    })

    const res = await GET(fakeRequest(ENV_VARS.CRON_SECRET))
    const json = (await res.json()) as { ok: boolean }

    expect(json.ok).toBe(false)
    // Só o SELECT — nenhum UPDATE porque o Google recusou o lote.
    expect(queryMock).toHaveBeenCalledTimes(1)
  })

  it('múltiplos leads: um único UPDATE em lote (`= any($1)`) com todos os ids, não um por lead', async () => {
    const lead2 = { ...leadComGclid, id: '43', gclid: 'outro-gclid-fake' }
    queryMock.mockResolvedValueOnce({ rows: [leadComGclid, lead2] })
    queryMock.mockResolvedValue({ rows: [] })

    await GET(fakeRequest(ENV_VARS.CRON_SECRET))

    // 1 SELECT + 1 único UPDATE atômico (não N UPDATEs sequenciais) — evita
    // estado parcial se o processo morrer no meio de um loop de updates.
    expect(queryMock).toHaveBeenCalledTimes(2)
    const [updateSql, updateParams] = queryMock.mock.calls[1] as [string, unknown[]]
    expect(updateSql).toMatch(/update cms\.leads/i)
    expect(updateSql).toMatch(/where id = any\(\$1(::bigint\[\])?\)/i)
    expect(updateParams).toHaveLength(1)
    expect(updateParams[0]).toEqual([leadComGclid.id, lead2.id])
  })

  it('cenário de update parcial não é possível: a marcação é um único array-update, não N updates individuais que poderiam falhar no meio', async () => {
    // Regressão do bug: um loop `for (lead of leads) await query(update ... id = $1)`
    // permitiria a exceção da 2ª chamada deixar o 1º lead já enviado ao Google
    // mas ainda com uploaded_to_ads=false — reentrando no SELECT de amanhã e
    // sendo reenviado (double-count). Com o update em lote isso não é possível
    // porque só existe UMA chamada de UPDATE pra todo o lote.
    const lead2 = { ...leadComGclid, id: '43', gclid: 'outro-gclid-fake' }
    queryMock.mockResolvedValueOnce({ rows: [leadComGclid, lead2] }) // SELECT
    queryMock.mockRejectedValueOnce(new Error('conexão caiu no meio do UPDATE')) // UPDATE falha

    const res = await GET(fakeRequest(ENV_VARS.CRON_SECRET))
    const json = (await res.json()) as { error: string }

    // A rota nunca lança (contrato "never throws") — erro vira 500 com corpo,
    // mas o ponto chave é que não existe uma 2ª/3ª chamada de UPDATE que
    // pudesse ter marcado só parte do lote antes da falha.
    expect(res.status).toBe(500)
    expect(json.error).toContain('conexão caiu no meio do UPDATE')
    expect(queryMock).toHaveBeenCalledTimes(2) // 1 SELECT + 1 UPDATE (que falhou) — nunca um 3º
  })
})
