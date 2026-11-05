import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  backoffCrm,
  ESPERA_CONCILIACAO_MS,
  LEASE_CRM_MS,
  MAX_TENTATIVAS_CRM,
} from '@/lib/crm/queue'

vi.mock('server-only', () => ({}))
const queryMock = vi.fn()
const exactMock = vi.fn()
const rdMock = vi.fn()
const sentryMock = vi.fn()
vi.mock('@/lib/db', () => ({ query: (...args: unknown[]) => queryMock(...args) }))
vi.mock('@/lib/exact/push-lead', () => ({
  pushLeadToExact: (...args: unknown[]) => exactMock(...args),
}))
vi.mock('@/lib/crm/rdstation/push-lead', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/crm/rdstation/push-lead')>()),
  pushLeadToRd: (...args: unknown[]) => rdMock(...args),
}))
vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => sentryMock(...args),
  flush: vi.fn().mockResolvedValue(true),
}))
const { enviarLeadAoCrm } = await import('@/lib/crm/send-lead')
const { crmProvider } = await import('@/lib/crm/provider')
const { RdAguardandoConciliacao, RdEsgotadoErro } = await import('@/lib/crm/rdstation/push-lead')
const { RdDuplicadosErro } = await import('@/lib/crm/rdstation/client')
const data = { nome: 'Maria' }

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('CRM_PROVIDER', 'exact')
  vi.stubEnv('EXACT_SPOTTER_TOKEN', 'teste')
  queryMock.mockResolvedValue({
    rows: [
      {
        id: '42',
        crm_contact_id: null,
        crm_post_iniciado_em: null,
        crm_attempts: 0,
        pode_criar: true,
      },
    ],
  })
})
afterEach(() => vi.unstubAllEnvs())

describe('seleção e registro do provedor CRM', () => {
  it('ausência da flag mantém Exact', () => {
    vi.stubEnv('CRM_PROVIDER', undefined)
    expect(crmProvider()).toBe('exact')
  })
  it('Exact ativo não chama RD e mantém histórico exact_*', async () => {
    exactMock.mockResolvedValue({ ok: true, exactLeadId: 123 })
    expect(await enviarLeadAoCrm('proposta', data, '42')).toEqual({ ok: true })
    expect(rdMock).not.toHaveBeenCalled()
    expect(exactMock).toHaveBeenCalledWith('proposta', data)
    expect(queryMock.mock.calls.find(([sql]) => sql.includes('set exact_lead_id'))?.[1]).toEqual([
      123,
      null,
      '42',
    ])
    expect(queryMock.mock.calls.at(-1)?.[1]).toEqual([
      '123',
      null,
      null,
      '42',
      'exact',
      false,
      ESPERA_CONCILIACAO_MS,
    ])
  })
  it('RD ativo nunca chama Exact, mesmo com token Exact definido', async () => {
    vi.stubEnv('CRM_PROVIDER', 'rdstation')
    rdMock.mockResolvedValue({ dealId: 'deal', contactId: 'contact' })
    expect(await enviarLeadAoCrm('proposta', data, '42')).toEqual({ ok: true })
    expect(exactMock).not.toHaveBeenCalled()
    expect(queryMock.mock.calls.at(-1)?.[1]).toEqual([
      'deal',
      'contact',
      null,
      '42',
      'rdstation',
      false,
      ESPERA_CONCILIACAO_MS,
    ])
    expect(queryMock.mock.calls.some(([sql]) => sql.includes('set exact_lead_id'))).toBe(false)
  })
  it('recriação agenda conciliação e emite warning; duplicados alertam com ids e não são apagados', async () => {
    vi.stubEnv('CRM_PROVIDER', 'rdstation')
    rdMock.mockResolvedValueOnce({ dealId: 'card-novo', contactId: 'contact', recriado: true })
    await enviarLeadAoCrm('proposta', data, '42')
    expect(queryMock.mock.calls.at(-1)?.[1]).toEqual([
      'card-novo',
      'contact',
      null,
      '42',
      'rdstation',
      true,
      ESPERA_CONCILIACAO_MS,
    ])
    expect(sentryMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: expect.stringContaining('recriado após incerteza') }),
      expect.objectContaining({ level: 'warning' }),
    )
    queryMock.mockClear()
    rdMock.mockRejectedValueOnce(new RdDuplicadosErro(['card-antigo', 'card-novo']))
    expect(await enviarLeadAoCrm('proposta', data, '42')).toMatchObject({ ok: false })
    expect(sentryMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: expect.stringContaining('card-antigo, card-novo') }),
      expect.objectContaining({ level: 'error' }),
    )
    expect(queryMock.mock.calls.at(-1)?.[1]).toEqual([
      expect.stringContaining('card-antigo, card-novo'),
      '42',
      'duplicado',
    ])
    expect(queryMock.mock.calls.some(([sql]) => /delete/i.test(sql))).toBe(false)
  })
  it('histórico de outro provedor ou lease ocupado não envia', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })
    expect(await enviarLeadAoCrm('proposta', data, '42')).toBeNull()
    expect(queryMock.mock.calls[0][0]).toContain('(crm_provider is null or crm_provider = $2)')
    expect(queryMock.mock.calls[0][0]).toContain('crm_travado_ate < now()')
    expect(exactMock).not.toHaveBeenCalled()
    expect(rdMock).not.toHaveBeenCalled()
  })
  it('erro de token é persistido e enviado ao Sentry, nunca silenciado', async () => {
    vi.stubEnv('CRM_PROVIDER', 'rdstation')
    rdMock.mockRejectedValue(new Error('RD Station: token ausente'))
    expect(await enviarLeadAoCrm('proposta', data, '42')).toMatchObject({
      ok: false,
      error: 'RD Station: token ausente',
    })
    expect(sentryMock).toHaveBeenCalledOnce()
    expect(queryMock.mock.calls.at(-1)?.[1]).toEqual([
      'RD Station: token ausente',
      '42',
      backoffCrm(1),
      1,
      MAX_TENTATIVAS_CRM,
    ])
  })
  it('reserva persiste marcador ANTES de criar e guarda contato para retry', async () => {
    vi.stubEnv('CRM_PROVIDER', 'rdstation')
    rdMock.mockImplementation(async (_form, _data, _id, estado) => {
      await estado.antesDoPost('contato')
      throw new Error('timeout')
    })
    await enviarLeadAoCrm('proposta', data, '42')
    expect(
      queryMock.mock.calls.some(
        ([sql, params]) =>
          sql.includes('crm_post_iniciado_em = coalesce(crm_post_iniciado_em, now())') &&
          params[0] === 'contato',
      ),
    ).toBe(true)
    expect(queryMock.mock.calls.at(-1)?.[0]).not.toContain('crm_post_iniciado_em = null')
  })
  it.each([
    'experience',
    'contato',
  ] as const)('%s sem proposta não entra em nenhum CRM', async (form) => {
    expect(await enviarLeadAoCrm(form, data, '42')).toBeNull()
    expect(queryMock).not.toHaveBeenCalled()
  })
  it('Exact sem token mantém integração desligada sem atribuir fila', async () => {
    vi.stubEnv('EXACT_SPOTTER_TOKEN', '')
    expect(await enviarLeadAoCrm('proposta', data, '42')).toBeNull()
    expect(queryMock).not.toHaveBeenCalled()
  })
})

describe('espera, reserva e migração', () => {
  it('aguardar conciliação não emite Sentry error nem falha de envio', async () => {
    vi.stubEnv('CRM_PROVIDER', 'rdstation')
    const tentarEm = new Date(Date.now() + 1000)
    rdMock.mockRejectedValue(new RdAguardandoConciliacao(tentarEm))
    expect(await enviarLeadAoCrm('proposta', data, '42')).toEqual({ ok: true, aguardando: true })
    expect(sentryMock).not.toHaveBeenCalled()
    expect(queryMock.mock.calls.at(-1)?.[1]).toEqual([tentarEm, '42'])
  })
  it('reserva atômica permite conciliação agendada com teto esgotado e fora48h', async () => {
    vi.stubEnv('CRM_PROVIDER', 'rdstation')
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          crm_deal_id: 'card',
          crm_contact_id: 'contato',
          crm_post_iniciado_em: new Date(0),
          crm_attempts: 5,
          pode_criar: false,
        },
      ],
    })
    rdMock.mockResolvedValue({ dealId: 'card', contactId: 'contato' })
    expect(await enviarLeadAoCrm('proposta', data, '42')).toEqual({ ok: true })
    expect(rdMock).toHaveBeenCalledWith(
      'proposta',
      data,
      '42',
      expect.objectContaining({ podeCriar: false, dealId: 'card' }),
    )
    const sql = queryMock.mock.calls[0][0]
    expect(sql).toContain('crm_reconciliar_em <= now()) or (')
    expect(sql).toContain('for update skip locked')
  })
  it('coluna ausente não vira silêncio: erro explícito de migração e Sentry', async () => {
    queryMock.mockRejectedValueOnce(
      Object.assign(new Error('column does not exist'), { code: '42703' }),
    )
    expect(await enviarLeadAoCrm('proposta', data, '42')).toMatchObject({
      ok: false,
      error: expect.stringContaining('ANTES do deploy'),
    })
    expect(sentryMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('estrutura ausente') }),
      expect.anything(),
    )
  })
})

describe('parâmetros SQL e estados terminais — barreiras das mutações', () => {
  it('M4 M5 M10: reserva usa janela, teto e lease das constantes como parâmetros SQL', async () => {
    expect(MAX_TENTATIVAS_CRM).toBe(5)
    expect(ESPERA_CONCILIACAO_MS).toBe(30 * 60_000)
    expect(LEASE_CRM_MS).toBe(5 * 60_000)
    queryMock.mockResolvedValueOnce({ rows: [] })
    await enviarLeadAoCrm('proposta', data, '42')
    const [sql, params] = queryMock.mock.calls[0]
    expect(params).toEqual(['42', 'exact', MAX_TENTATIVAS_CRM, ESPERA_CONCILIACAO_MS, LEASE_CRM_MS])
    expect(sql).toContain('crm_attempts < $3 as pode_criar')
    expect(sql).toContain(
      "crm_post_iniciado_em + ($4::double precision * interval '1 millisecond') as crm_conciliar_em",
    )
    expect(sql).toContain(
      "crm_travado_ate = now() + ($5::double precision * interval '1 millisecond')",
    )
    expect(sql).not.toMatch(/interval '(30|5) minutes'/)
  })
  it('M9: antesDoPost agenda a conciliação, grava marcador e só então autoriza o POST', async () => {
    vi.stubEnv('CRM_PROVIDER', 'rdstation')
    rdMock.mockImplementation(async (_form, _data, _id, estado) => {
      await estado.antesDoPost('contato')
      return { dealId: 'card', contactId: 'contato' }
    })
    await enviarLeadAoCrm('proposta', data, '42')
    const [sql, params] = queryMock.mock.calls[1]
    expect(sql).toContain(
      "crm_reconciliar_em = now() + ($3::double precision * interval '1 millisecond')",
    )
    expect(sql).toContain('crm_attempts = crm_attempts + 1')
    expect(sql).toContain('crm_attempts < $4 returning id')
    expect(params).toEqual(['contato', '42', ESPERA_CONCILIACAO_MS, MAX_TENTATIVAS_CRM])
  })
  it('M25: registrarFalha usa backoffCrm calculado com a tentativa atual', async () => {
    vi.stubEnv('CRM_PROVIDER', 'rdstation')
    queryMock.mockResolvedValueOnce({
      rows: [
        { crm_attempts: 2, crm_contact_id: null, crm_post_iniciado_em: null, pode_criar: true },
      ],
    })
    rdMock.mockRejectedValue(new Error('configuração inválida'))
    await enviarLeadAoCrm('proposta', data, '42')
    const [sql, params] = queryMock.mock.calls.at(-1) ?? []
    expect(sql).toContain(
      "crm_proxima_tentativa_em = now() + ($3::double precision * interval '1 millisecond')",
    )
    expect(sql).not.toContain('power(')
    expect(params).toEqual(['configuração inválida', '42', backoffCrm(3), 1, MAX_TENTATIVAS_CRM])
    expect(params[2]).toBe(240 * 60_000)
  })
  it('M23: falha do Exact não preenche deal_id nem status enviado', async () => {
    exactMock.mockResolvedValue({ ok: false, error: 'Exact HTTP 500' })
    expect(await enviarLeadAoCrm('proposta', data, '42')).toMatchObject({ ok: false })
    expect(
      queryMock.mock.calls.some(
        ([sql]) => sql.includes('set crm_deal_id') || sql.includes("crm_status = 'enviado'"),
      ),
    ).toBe(false)
    expect(queryMock.mock.calls.find(([sql]) => sql.includes('set exact_lead_id'))?.[1]).toEqual([
      null,
      'Exact HTTP 500',
      '42',
    ])
  })
  it('personError é warning porque a negociação Exact já existe', async () => {
    exactMock.mockResolvedValue({ ok: true, exactLeadId: 7, personError: 'Contato recusado' })
    expect(await enviarLeadAoCrm('proposta', data, '42')).toEqual({ ok: true })
    expect(sentryMock).toHaveBeenCalledOnce()
    expect(sentryMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Contato recusado' }),
      expect.objectContaining({ level: 'warning' }),
    )
  })
  it('conciliação que apenas encontra card não altera crm_attempts', async () => {
    vi.stubEnv('CRM_PROVIDER', 'rdstation')
    rdMock.mockResolvedValue({ dealId: 'card', contactId: 'contato' })
    expect(await enviarLeadAoCrm('proposta', data, '42')).toEqual({ ok: true })
    expect(queryMock.mock.calls.some(([sql]) => /crm_attempts\s*=/.test(sql))).toBe(false)
  })
  it.each([
    'duplicado',
    'esgotado',
  ] as const)('%s é terminal e alerta somente na primeira transição', async (status) => {
    vi.stubEnv('CRM_PROVIDER', 'rdstation')
    let terminal = false
    queryMock.mockImplementation(async (sql: string) => {
      if (sql.startsWith('with candidato'))
        return { rows: terminal ? [] : [{ crm_attempts: 5, pode_criar: false }] }
      if (sql.includes('set crm_status = $3')) {
        const rows = terminal ? [] : [{ id: '42' }]
        terminal = true
        return { rows }
      }
      return { rows: [] }
    })
    rdMock.mockRejectedValue(
      status === 'duplicado' ? new RdDuplicadosErro(['A', 'B']) : new RdEsgotadoErro(),
    )
    expect(await enviarLeadAoCrm('proposta', data, '42')).toMatchObject({ ok: false })
    expect(await enviarLeadAoCrm('proposta', data, '42')).toBeNull()
    expect(sentryMock).toHaveBeenCalledOnce()
    expect(sentryMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ level: 'error' }),
    )
    const terminalQuery = queryMock.mock.calls.find(([sql]) => sql.includes('set crm_status = $3'))
    expect(terminalQuery?.[0]).toContain("crm_status not in ('duplicado', 'esgotado') returning id")
    expect(terminalQuery?.[1][2]).toBe(status)
    expect(queryMock.mock.calls.some(([sql]) => /delete/i.test(sql))).toBe(false)
  })
})
