import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SQL_AMBIENTE_LIBERADO } from '@/lib/leads/ambiente'
import { SQL_PRONTO_PARA_ENVIO } from '@/lib/leads/criterios'

/**
 * Cron `push-exact-leads` (a cada 15 min): (A) reivindica a etapa 1 parada há 45 min e manda
 * Exact + e-mail + Ads pela pós-gravação; (B) reenvia ao Exact o que falhou, com trava entre
 * execuções. Banco, pós-gravação e push mocados; o SQL é conferido pelo texto, e o roteamento do
 * dublê é pela etiqueta em comentário de cada consulta.
 */

const queryMock = vi.fn()
const pushLeadMock = vi.fn()
const posGravacaoMock = vi.fn()
const captureExceptionMock = vi.fn()

vi.mock('server-only', () => ({}))
vi.mock('@sentry/nextjs', () => ({
  captureException: (...a: unknown[]) => captureExceptionMock(...a),
}))
vi.mock('@/lib/db', () => ({ query: (...a: unknown[]) => queryMock(...a) }))
vi.mock('@/lib/exact/push-lead', () => ({
  pushLeadToExact: (...a: unknown[]) => pushLeadMock(...a),
}))
vi.mock('@/lib/leads/posGravacao', () => ({
  processarPosGravacao: (...a: unknown[]) => posGravacaoMock(...a),
}))

const { GET } = await import('@/app/api/cron/push-exact-leads/route')

function fakeRequest(bearer?: string): Request {
  const headers = new Headers()
  if (bearer !== undefined) headers.set('authorization', `Bearer ${bearer}`)
  return new Request('http://localhost/api/cron/push-exact-leads', { headers })
}

const etapa1Vencida = {
  id: '61',
  form: 'proposta',
  etapa: 1,
  data: {
    nomeCondominio: 'Aurora',
    uf: 'PB',
    telefone: '+5583999501388',
    variante: 'duas-etapas',
    ambiente: 'production',
  },
  gclid: null,
  ads_consent: 'granted',
  created_at: '2026-10-16T10:00:00.000Z',
  notificado_para: 'comercial.pb@semog.com.br',
}
const pendente = {
  id: '42',
  form: 'proposta',
  etapa: null,
  data: { nome: 'Maria', nomeCondominio: 'Aurora', email: 'm@x.com', telefone: '+5583999501388' },
}

function bancoCom(fila: { etapa1?: unknown[]; reenvio?: unknown[] }) {
  queryMock.mockImplementation(async (sql: string) => {
    if (sql.includes('cron:reivindicar-etapa1')) return { rows: fila.etapa1 ?? [] }
    if (sql.includes('cron:reivindicar-reenvio-exact')) return { rows: fila.reenvio ?? [] }
    return { rows: [], rowCount: 1 }
  })
}
function sqlDe(etiqueta: string): string {
  return String(queryMock.mock.calls.find(([sql]) => String(sql).includes(etiqueta))?.[0] ?? '')
}
function updatesDoExact() {
  return queryMock.mock.calls.filter(([sql]) => /set exact_lead_id = \$1/.test(String(sql))) as [
    string,
    unknown[],
  ][]
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('CRON_SECRET', 'segredo-de-teste')
  posGravacaoMock.mockResolvedValue({ exact: 'enviado', email: 'enviado', ads: 'sem_clique' })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('cron push-exact-leads', () => {
  it('sem bearer correto devolve 401 e não consulta o banco', async () => {
    const res = await GET(fakeRequest('errado'))
    expect(res.status).toBe(401)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('etapa 1 vencida: reivindica e manda Exact, e-mail e Ads uma vez, pela pós-gravação (R3)', async () => {
    bancoCom({ etapa1: [etapa1Vencida] })
    const res = await GET(fakeRequest('segredo-de-teste'))
    const body = (await res.json()) as { ok: boolean; etapa1: { reivindicadas: number } }
    expect(res.status).toBe(200)
    expect(body.etapa1.reivindicadas).toBe(1)
    expect(posGravacaoMock).toHaveBeenCalledTimes(1)
    expect(posGravacaoMock).toHaveBeenCalledWith(etapa1Vencida, 'cron')
    expect(pushLeadMock).not.toHaveBeenCalled()
  })

  it('corrida: o que outra execução já reivindicou não volta, porque a trava é do banco', async () => {
    bancoCom({})
    await GET(fakeRequest('segredo-de-teste'))
    expect(posGravacaoMock).not.toHaveBeenCalled()
    const sql = sqlDe('cron:reivindicar-etapa1')
    expect(sql).toMatch(/update cms\.leads set envio_em = now\(\)/)
    expect(sql).toMatch(/where envio_em is null/)
    expect(sql).toMatch(/for update skip locked/)
    expect(sql).toMatch(
      /returning id, form, etapa, data, gclid, ads_consent, created_at, notificado_para/,
    )
  })

  it('critério da etapa 1: só proposta de produção, com etapa 1 há mais de 45 min, dentro da janela', async () => {
    bancoCom({})
    await GET(fakeRequest('segredo-de-teste'))
    const sql = sqlDe('cron:reivindicar-etapa1')
    expect(sql).toMatch(/and etapa = 1/)
    expect(sql).toMatch(/and form = 'proposta'/)
    expect(sql).toContain("created_at < now() - interval '45 minutes'")
    expect(sql).toMatch(/created_at > \$1/)
    expect(sql).toContain(SQL_AMBIENTE_LIBERADO)
  })

  it('critério do reenvio: o da spec 4.3, só captação de produção, não cliente, já processada, com trava', async () => {
    bancoCom({})
    await GET(fakeRequest('segredo-de-teste'))
    const sql = sqlDe('cron:reivindicar-reenvio-exact')
    expect(SQL_PRONTO_PARA_ENVIO).toBe(
      "(etapa is null or etapa = 2 or created_at < now() - interval '45 minutes')",
    )
    expect(sql).toContain(SQL_PRONTO_PARA_ENVIO)
    expect(sql).toMatch(/exact_lead_id is null/)
    expect(sql).toMatch(/exact_attempts < \$2/)
    expect(sql).toMatch(/form = 'contato' and data->>'assunto' = 'proposta-comercial'/)
    expect(sql).toContain(SQL_AMBIENTE_LIBERADO)
    expect(sql).toContain("coalesce(data->>'cliente', '') <> 'sim'")
    expect(sql).toMatch(/envio_em is not null and envio_em < now\(\) - interval '10 minutes'/)
    expect(sql).toMatch(
      /exact_tentativa_em is null or exact_tentativa_em < now\(\) - interval '10 minutes'/,
    )
    expect(sql).toMatch(/update cms\.leads set exact_tentativa_em = now\(\)/)
    expect(sql).toMatch(/for update skip locked/)
  })

  it('linha com etapa nula (formulário antigo) é reenviada como completa e grava o id', async () => {
    bancoCom({ reenvio: [pendente] })
    pushLeadMock.mockResolvedValue({ ok: true, exactLeadId: 777 })
    const res = await GET(fakeRequest('segredo-de-teste'))
    const body = (await res.json()) as { ok: boolean; enviados: number; falhas: number }
    expect(body).toMatchObject({ ok: true, enviados: 1, falhas: 0 })
    expect(pushLeadMock).toHaveBeenCalledWith('proposta', pendente.data)
    expect(updatesDoExact()[0]?.[1]).toEqual([777, null, '42'])
  })

  it('reenvio de etapa 1 leva "etapa: 1" ao mapeamento (descrição parcial)', async () => {
    bancoCom({ reenvio: [{ ...pendente, etapa: 1 }] })
    pushLeadMock.mockResolvedValue({ ok: true, exactLeadId: 778 })
    await GET(fakeRequest('segredo-de-teste'))
    expect(pushLeadMock).toHaveBeenCalledWith('proposta', { ...pendente.data, etapa: '1' })
  })

  it('falha continua contabilizada e não interrompe o lote', async () => {
    bancoCom({ reenvio: [pendente, { ...pendente, id: '43' }] })
    pushLeadMock
      .mockResolvedValueOnce({ ok: false, error: 'Exact fora do ar' })
      .mockResolvedValueOnce({ ok: true, exactLeadId: 778 })
    const res = await GET(fakeRequest('segredo-de-teste'))
    expect(await res.json()).toMatchObject({ ok: false, enviados: 1, falhas: 1 })
    expect(updatesDoExact()).toHaveLength(2)
  })

  it('falha do reenvio vai ao Sentry só com passo, origem e id (R8), sem o erro do Exact', async () => {
    bancoCom({ reenvio: [pendente] })
    pushLeadMock.mockResolvedValue({ ok: false, error: 'telefone +5583999501388 recusado' })
    await GET(fakeRequest('segredo-de-teste'))
    expect(captureExceptionMock).toHaveBeenCalledTimes(1)
    const [erro, contexto] = captureExceptionMock.mock.calls[0] as [Error, { extra: unknown }]
    expect(erro.message).not.toContain('+5583999501388')
    expect(contexto.extra).toEqual({ leadId: '42' })
  })

  it('erro no banco vira 500 e vai ao Sentry', async () => {
    queryMock.mockRejectedValue(new Error('connection refused'))
    const res = await GET(fakeRequest('segredo-de-teste'))
    expect(res.status).toBe(500)
    expect(captureExceptionMock).toHaveBeenCalledTimes(1)
  })
})
