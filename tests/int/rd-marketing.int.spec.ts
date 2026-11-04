import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { converterNoMarketing } from '@/lib/rdMarketing/client'
import { montarConversaoMarketing } from '@/lib/rdMarketing/payload'
import { ocultarChaveMarketing } from '@/lib/rdMarketing/sentry'

vi.mock('server-only', () => ({}))
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  warning: vi.fn(),
  flush: vi.fn(),
  after: vi.fn(),
  init: vi.fn(),
}))
vi.mock('@/lib/db', () => ({ query: mocks.query }))
vi.mock('@sentry/nextjs', () => ({
  captureMessage: mocks.warning,
  flush: mocks.flush,
  init: mocks.init,
}))
vi.mock('next/server', () => ({ after: mocks.after }))
const { enviarConversaoMarketing, retentarConversoesMarketing, agendarConversaoMarketing } =
  await import('@/lib/rdMarketing/fila')

const uuid = '43b00843-09af-4fae-bf9d-a0697640b808'
const lead = {
  nome: 'Maria',
  email: 'maria@example.invalid',
  telefone: '+5581999999999',
  cidade: 'Recife e região',
  cargo: 'Síndico',
  nomeCondominio: 'Aurora',
}
const contexto = { cookies: { get: () => undefined }, atribuicao: null, permitido: true }
const conversao = montarConversaoMarketing('proposta', lead, contexto)
if (!conversao) throw new Error('fixture inválida')
const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('RD_MARKETING_API_KEY', 'chave-secreta-teste')
  vi.stubGlobal('fetch', fetchMock)
  mocks.flush.mockResolvedValue(true)
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('payload Marketing', () => {
  it('mapeia campos reais, origem e UUID, sem oportunidade ou negociação', async () => {
    const payload = montarConversaoMarketing('proposta', lead, {
      ...contexto,
      cookies: { get: (name) => (name === '_rdtrk' ? { value: uuid } : undefined) },
      atribuicao: {
        first: { source: 'google', medium: 'cpc', campaign: 'sindicos', landing: '/' },
        last: { source: 'google', medium: 'cpc', campaign: 'sindicos', landing: '/' },
      },
    })
    if (!payload) throw new Error('payload ausente')
    fetchMock.mockImplementation(async (url, options) => {
      expect(String(url)).toBe(
        'https://api.rd.services/platform/conversions?api_key=chave-secreta-teste',
      )
      expect(options?.method).toBe('POST')
      expect(options?.redirect).toBe('error')
      expect(options?.signal).toBeInstanceOf(AbortSignal)
      expect(options?.headers).toEqual({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      })
      expect(JSON.parse(String(options?.body))).toEqual({
        event_type: 'CONVERSION',
        event_family: 'CDP',
        payload: {
          conversion_identifier: 'pedido-proposta-site',
          name: 'Maria',
          email: 'maria@example.invalid',
          phone: '+5581999999999',
          mobile_phone: '+5581999999999',
          city: 'Recife e região',
          job_title: 'Síndico',
          company_name: 'Aurora',
          client_tracking_id: uuid,
          traffic_source: 'google',
          traffic_medium: 'cpc',
          traffic_campaign: 'sindicos',
          legal_bases: [
            { category: 'communications', type: 'legitimate_interest', status: 'granted' },
          ],
        },
      })
      return Response.json({ event_uuid: uuid })
    })
    expect(await converterNoMarketing('chave-secreta-teste', payload)).toEqual({
      status: 'enviado',
      eventUuid: uuid,
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('contato aprovado tem identificador próprio; atendimento/evento/repetido ficam fora', () => {
    expect(
      montarConversaoMarketing('contato', { ...lead, assunto: 'proposta-comercial' }, contexto)
        ?.payload.conversion_identifier,
    ).toBe('contato-site')
    expect(
      montarConversaoMarketing('contato', { ...lead, assunto: 'segunda-via-boleto' }, contexto),
    ).toBeNull()
    expect(montarConversaoMarketing('experience', lead, contexto)).toBeNull()
    expect(montarConversaoMarketing('proposta', { ...lead, duplicaDe: '17' }, contexto)).toBeNull()
    expect(montarConversaoMarketing('proposta', lead, { ...contexto, permitido: false })).toBeNull()
  })

  it('sem cookie omite tracking; proposta rápida usa telefone sem inventar e-mail', () => {
    expect(conversao.payload.client_tracking_id).toBeUndefined()
    const curto = montarConversaoMarketing(
      'proposta',
      { nome: 'Maria', telefone: '+5581999999999' },
      contexto,
    )
    expect(curto?.payload.email).toBeUndefined()
    expect(curto?.payload.phone).toBe('+5581999999999')
  })

  it('respeita também a preferência URI-encoded gravada pelo site, antes da regra regional', () => {
    const cookie = (marketing: boolean) => ({
      get: (name: string) =>
        name === 'semog-consent'
          ? {
              value: encodeURIComponent(
                JSON.stringify({ necessary: true, analytics: true, marketing }),
              ),
            }
          : undefined,
    })
    expect(
      montarConversaoMarketing('proposta', lead, { ...contexto, cookies: cookie(false) }),
    ).toBeNull()
    expect(
      montarConversaoMarketing('proposta', lead, {
        ...contexto,
        permitido: false,
        cookies: cookie(true),
      }),
    ).not.toBeNull()
  })

  it('aceita rdtrk JSON e ignora cookie inválido ou opt-out de análise', () => {
    const cookie = encodeURIComponent(JSON.stringify({ id: uuid }))
    expect(
      montarConversaoMarketing('proposta', lead, {
        ...contexto,
        cookies: { get: (name) => (name === 'rdtrk' ? { value: cookie } : undefined) },
      })?.payload.client_tracking_id,
    ).toBe(uuid)
    expect(
      montarConversaoMarketing('proposta', lead, {
        ...contexto,
        cookies: { get: () => ({ value: '%inválido' }) },
      })?.payload.client_tracking_id,
    ).toBeUndefined()
    expect(
      montarConversaoMarketing('proposta', lead, {
        ...contexto,
        cookies: {
          get: (name) => ({
            value:
              name === 'semog-consent'
                ? JSON.stringify({ necessary: true, analytics: false, marketing: true })
                : uuid,
          }),
        },
      })?.payload.client_tracking_id,
    ).toBeUndefined()
  })
})

describe('reserva e envio', () => {
  it('sem env não consulta banco, não envia e não agenda; registra informação', async () => {
    vi.stubEnv('RD_MARKETING_API_KEY', '')
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    await enviarConversaoMarketing('7')
    await retentarConversoesMarketing()
    agendarConversaoMarketing('7')
    expect(mocks.query).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(mocks.after).not.toHaveBeenCalled()
    expect(info).toHaveBeenCalled()
    info.mockRestore()
  })

  it('duas chamadas da fila fazem uma conversão após confirmação', async () => {
    mocks.query
      .mockResolvedValueOnce({
        rows: [{ id: '7', rd_marketing_payload: conversao, rd_marketing_attempts: 1 }],
      })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rows: [] })
    fetchMock.mockResolvedValue(Response.json({ event_uuid: uuid }))
    await enviarConversaoMarketing('7')
    await enviarConversaoMarketing('7')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(mocks.query.mock.calls[0]?.[0]).toContain('rd_marketing_attempts < 2')
    expect(mocks.query.mock.calls[1]?.[1]).toEqual(['7', 'enviado', uuid, null, 1])
  })

  it.each([
    400, 401, 422,
  ])('HTTP %s é terminal e gera warning sem dados ou chave', async (status) => {
    mocks.query
      .mockResolvedValueOnce({
        rows: [{ id: '7', rd_marketing_payload: conversao, rd_marketing_attempts: 1 }],
      })
      .mockResolvedValueOnce({ rowCount: 1 })
    fetchMock.mockResolvedValue(Response.json({ error: 'payload secreto' }, { status }))
    await expect(enviarConversaoMarketing('7')).resolves.toBeUndefined()
    expect(mocks.query.mock.calls[1]?.[1]?.[1]).toBe('erro')
    expect(mocks.warning).toHaveBeenCalledWith('Falha na conversão RD Marketing', {
      level: 'warning',
      tags: { fluxo: 'rd_marketing', codigo: `http_${status}`, lead_id: '7' },
    })
    expect(JSON.stringify(mocks.warning.mock.calls)).not.toContain('chave-secreta-teste')
  })

  it.each([
    1, 2,
  ])('timeout na tentativa %s mantém teto e não rejeita a chamada', async (attempt) => {
    mocks.query
      .mockResolvedValueOnce({
        rows: [{ id: '7', rd_marketing_payload: conversao, rd_marketing_attempts: attempt }],
      })
      .mockResolvedValueOnce({ rowCount: 1 })
    fetchMock.mockRejectedValue(new Error('url?api_key=segredo'))
    await expect(enviarConversaoMarketing('7')).resolves.toBeUndefined()
    expect(mocks.query.mock.calls[0]?.[0]).toContain("interval '30 minutes'")
    expect(mocks.query.mock.calls[1]?.[1]?.[1]).toBe(attempt === 1 ? 'incerto' : 'esgotado')
    expect(JSON.stringify(mocks.warning.mock.calls)).not.toContain('segredo')
  })

  it('500, 429 e sucesso sem UUID não fingem confirmação', async () => {
    for (const status of [500, 429, 200]) {
      fetchMock.mockResolvedValueOnce(Response.json({}, { status }))
      expect((await converterNoMarketing('teste', conversao)).status).toBe('incerto')
    }
  })

  it('falha do banco não escapa e agendamento não chama fetch antes da resposta', async () => {
    mocks.query.mockRejectedValue(new Error('banco fora'))
    await expect(enviarConversaoMarketing('7')).resolves.toBeUndefined()
    agendarConversaoMarketing('7')
    expect(mocks.after).toHaveBeenCalledOnce()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('redige api_key em erros, breadcrumbs e spans do Sentry', () => {
    const url = 'https://api.rd.services/platform/conversions?api_key=chave%20secreta&x=1'
    const event = {
      exception: { values: [{ value: `fetch ${url}` }] },
      breadcrumbs: [{ data: { url } }],
      spans: [
        { description: url, data: { 'http.url': url, 'url.query': 'api_key=chave%20secreta' } },
      ],
    }
    expect(JSON.stringify(ocultarChaveMarketing(event))).not.toContain('chave%20secreta')
    expect(JSON.stringify(event)).toContain('api_key=[Filtered]&x=1')
  })

  it('o Sentry do servidor aplica a redação também aos spans automáticos', async () => {
    await import('@/sentry.server.config')
    expect(mocks.init.mock.calls[0]?.[0]).toMatchObject({
      beforeSend: ocultarChaveMarketing,
      beforeSendTransaction: ocultarChaveMarketing,
      beforeSendSpan: ocultarChaveMarketing,
    })
  })
})
