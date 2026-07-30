import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `pushLeadToExact`: elegibilidade → `POST /LeadsAdd` → `POST /PersonsAdd`.
 * O `fetch` global é mockado; nada sai da máquina.
 *
 * Formato das chamadas confirmado por probe em 2026-07-29 (ver
 * `scripts/probe-exact-create-lead.ts`): corpo aninhado em `lead`, resposta
 * `{ value: <id> }`.
 */

const fetchMock = vi.fn()

// `client.ts` importa `server-only`, que lança no ambiente jsdom do vitest —
// o pacote é uma guarda de bundle (impedir que o token vá pro client), não
// tem comportamento em runtime, então stub vazio basta.
vi.mock('server-only', () => ({}))

const { pushLeadToExact } = await import('@/lib/exact/push-lead')

const proposta: Record<string, string> = {
  tipo: 'Condomínio residencial',
  nome: 'Maria Souza',
  nomeCondominio: 'Residencial Aurora',
  cargo: 'Síndico(a)',
  email: 'maria@example.com',
  telefone: '+5583999501388',
  cidade: 'João Pessoa e região',
  unidades: '84',
  mensagem: 'Queremos uma proposta.',
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('EXACT_SPOTTER_BASE_URL', 'https://exact.test/v3')
  vi.stubEnv('EXACT_SPOTTER_TOKEN', 'tok-teste')
  vi.stubEnv('EXACT_SDR_EMAIL', 'daiane@semog.com.br')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('pushLeadToExact', () => {
  it('cria lead e contato principal e devolve o id', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(201, { value: 51199001 }))
      .mockResolvedValueOnce(jsonResponse(201, { value: 54075982 }))

    const result = await pushLeadToExact('proposta', proposta)

    expect(result).toEqual({ ok: true, exactLeadId: 51199001 })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    const [leadUrl, leadInit] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(leadUrl).toBe('https://exact.test/v3/LeadsAdd')
    expect((leadInit.headers as Record<string, string>).token_exact).toBe('tok-teste')
    expect(JSON.parse(leadInit.body as string)).toMatchObject({
      duplicityValidation: false,
      lead: {
        name: 'Residencial Aurora',
        funnelId: 24653,
        source: 'Site',
        industry: 'João Pessoa',
        ddiPhone: '55',
        phone: '83999501388',
        sdrEmail: 'daiane@semog.com.br',
      },
    })

    const [personUrl, personInit] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(personUrl).toBe('https://exact.test/v3/PersonsAdd')
    expect(JSON.parse(personInit.body as string)).toMatchObject({
      leadId: 51199001,
      name: 'Maria Souza',
      mainContact: true,
    })
  })

  it('não manda customFields (quebra o binder da API)', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(201, { value: 1 }))
      .mockResolvedValueOnce(jsonResponse(201, {}))

    await pushLeadToExact('proposta', proposta)

    const corpo = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(corpo.lead.customFields).toBeUndefined()
    expect(corpo.lead.subSource).toBeUndefined()
  })

  it('lead não elegível não chama a API', async () => {
    const result = await pushLeadToExact('contato', { assunto: 'segunda-via-boleto', nome: 'X' })
    expect(result).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sem token configurado é no-op', async () => {
    vi.stubEnv('EXACT_SPOTTER_TOKEN', '')
    const result = await pushLeadToExact('proposta', proposta)
    expect(result).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('erro no POST /LeadsAdd devolve ok:false com o status', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(400, { error: { message: 'The request is invalid.' } }))

    const result = await pushLeadToExact('proposta', proposta)

    expect(result).toMatchObject({ ok: false })
    expect((result as { error: string }).error).toMatch(/400/)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('lead criado com contato falhando ainda é sucesso (com personError)', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(201, { value: 51199002 }))
      .mockResolvedValueOnce(jsonResponse(500, { error: 'boom' }))

    const result = await pushLeadToExact('proposta', proposta)

    expect(result).toMatchObject({ ok: true, exactLeadId: 51199002 })
    expect((result as { personError?: string }).personError).toMatch(/500/)
  })

  it('resposta sem id busca o lead recém-criado pelo telefone', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(201, {}))
      .mockResolvedValueOnce(jsonResponse(200, { value: [{ id: 51199003 }] }))
      .mockResolvedValueOnce(jsonResponse(201, {}))

    const result = await pushLeadToExact('proposta', proposta)

    expect(result).toMatchObject({ ok: true, exactLeadId: 51199003 })
    const [buscaUrl] = fetchMock.mock.calls[1] as [string]
    expect(buscaUrl).toContain('/Leads?')
    expect(decodeURIComponent(buscaUrl)).toContain('5583999501388')
  })

  it('falha de rede vira ok:false, não exceção', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'))
    const result = await pushLeadToExact('proposta', proposta)
    expect(result).toMatchObject({ ok: false })
    expect((result as { error: string }).error).toMatch(/network down/)
  })
})
