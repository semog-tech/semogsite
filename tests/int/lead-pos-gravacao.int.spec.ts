import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LinhaDoLead } from '@/lib/leads/linha'

const queryMock = vi.fn()
const pushLeadMock = vi.fn()
const sendMailMock = vi.fn()
const ingerirMock = vi.fn()
const tokenAdsMock = vi.fn()
const configAdsMock = vi.fn()
const captureExceptionMock = vi.fn()

vi.mock('server-only', () => ({}))
vi.mock('@sentry/nextjs', () => ({
  captureException: (...a: unknown[]) => captureExceptionMock(...a),
}))
vi.mock('@/lib/db', () => ({ query: (...a: unknown[]) => queryMock(...a) }))
vi.mock('@/lib/exact/push-lead', () => ({
  pushLeadToExact: (...a: unknown[]) => pushLeadMock(...a),
}))
vi.mock('@/lib/sendgrid', () => ({ sendMail: (...a: unknown[]) => sendMailMock(...a) }))
vi.mock('@/lib/ads/conversoes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/ads/conversoes')>()),
  lerConfigAds: () => configAdsMock(),
  obterTokenAds: (...a: unknown[]) => tokenAdsMock(...a),
  ingerirConversoes: (...a: unknown[]) => ingerirMock(...a),
}))

const { processarPosGravacao } = await import('@/lib/leads/posGravacao')

const CONFIG = { login: '1', customer: '2', acaoProposta: '999', subject: 'a@b', saJson: '{}' }

function linha(sobre: Partial<LinhaDoLead> = {}, dados: Record<string, string> = {}): LinhaDoLead {
  return {
    id: '501',
    form: 'proposta',
    etapa: 2,
    gclid: 'GCLID-1',
    ads_consent: 'granted',
    created_at: new Date('2026-10-16T12:00:00Z'),
    notificado_para: 'comercial.pb@semog.com.br',
    data: {
      nomeCondominio: 'Aurora',
      uf: 'PB',
      telefone: '+5583999501388',
      email: 'maria@example.com',
      nome: 'Maria',
      cargo: 'Síndico(a)',
      cidade: 'Campina Grande',
      cliente: 'nao',
      variante: 'duas-etapas',
      ambiente: 'production',
      'origem — Canal (origem)': 'Google Ads (tráfego pago)',
      ...dados,
    },
    ...sobre,
  }
}

function sqls(): string[] {
  return queryMock.mock.calls.map(([sql]) => String(sql))
}

beforeEach(() => {
  vi.resetAllMocks()
  queryMock.mockResolvedValue({ rows: [], rowCount: 1 })
  pushLeadMock.mockResolvedValue({ ok: true, exactLeadId: 777 })
  sendMailMock.mockResolvedValue({ ok: true })
  configAdsMock.mockReturnValue(CONFIG)
  tokenAdsMock.mockResolvedValue('token-ads')
  ingerirMock.mockResolvedValue({ ok: true, status: 200, resposta: '{}' })
})

describe('pós-gravação: Exact, e-mail e Ads uma vez cada (spec 4.3 e 4.4)', () => {
  it('etapa 2 de produção: Exact, e-mail interno, aviso ao lead e conversão lead-<id>', async () => {
    const resumo = await processarPosGravacao(linha(), 'acao')

    expect(resumo).toEqual({ exact: 'enviado', email: 'enviado', ads: 'enviado' })
    expect(pushLeadMock).toHaveBeenCalledTimes(1)
    expect(pushLeadMock.mock.calls[0]?.[1]).toMatchObject({ nomeCondominio: 'Aurora', etapa: '2' })
    expect(sqls().some((s) => /set exact_lead_id = \$1/.test(s))).toBe(true)
    expect(sendMailMock).toHaveBeenCalledTimes(2)
    expect(sendMailMock.mock.calls[0]?.[0]).toMatchObject({
      to: ['comercial.pb@semog.com.br'],
      subject: 'Novo contato via Proposta',
    })
    expect(sendMailMock.mock.calls[1]?.[0]).toMatchObject({ to: 'maria@example.com' })
    expect(ingerirMock).toHaveBeenCalledTimes(1)
    const [, , destino, eventos] = ingerirMock.mock.calls[0] as [
      string,
      unknown,
      string,
      { transactionId: string; tipoDeClique: string }[],
    ] // as: os mocks guardam os argumentos como unknown
    expect(destino).toBe('999')
    expect(eventos[0]).toMatchObject({
      transactionId: 'lead-501',
      tipoDeClique: 'gclid',
      clique: 'GCLID-1',
    })
    expect(sqls().some((s) => /set uploaded_to_ads = true where id = \$1/.test(s))).toBe(true)
  })

  it('só etapa 1 (cron): Exact recebe etapa 1 e o e-mail avisa que é parcial', async () => {
    await processarPosGravacao(
      linha({ etapa: 1 }, { nome: '', cargo: '', cidade: '', cliente: '' }),
      'cron',
    )
    expect(pushLeadMock.mock.calls[0]?.[1]).toMatchObject({ etapa: '1' })
    expect(sendMailMock.mock.calls[0]?.[0]).toMatchObject({
      subject: 'Novo contato via Proposta (só etapa 1)',
    })
  })

  it('já é cliente: nem Exact nem Ads; o e-mail interno avisa que é cliente', async () => {
    const resumo = await processarPosGravacao(linha({}, { cliente: 'sim' }), 'acao')
    expect(resumo.exact).toBe('nao_enviado')
    expect(resumo.ads).toBe('nao_elegivel')
    expect(pushLeadMock).not.toHaveBeenCalled()
    expect(ingerirMock).not.toHaveBeenCalled()
    const aviso = sendMailMock.mock.calls[0]?.[0] as { subject: string } // as: argumento de mock é unknown
    expect(aviso.subject).toBe('Novo contato via Proposta (já é cliente Semog)')
  })

  it('ambiente fora de produção: nada sai (R1)', async () => {
    for (const ambiente of ['preview', 'local', 'development']) {
      const resumo = await processarPosGravacao(linha({}, { ambiente }), 'acao')
      expect(resumo).toEqual({ exact: 'bloqueado', email: 'bloqueado', ads: 'bloqueado' })
    }
    expect(pushLeadMock).not.toHaveBeenCalled()
    expect(sendMailMock).not.toHaveBeenCalled()
    expect(ingerirMock).not.toHaveBeenCalled()
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('linha antiga sem a chave ambiente processa normalmente', async () => {
    const semAmbiente = linha()
    delete semAmbiente.data.ambiente
    expect((await processarPosGravacao(semAmbiente, 'cron')).exact).toBe('enviado')
  })

  it('falha do Ads não derruba Exact nem e-mail, vai ao Sentry e não marca uploaded_to_ads (D1)', async () => {
    ingerirMock.mockResolvedValue({ ok: false, status: 500, resposta: 'erro' })
    const resumo = await processarPosGravacao(linha(), 'acao')
    expect(resumo).toEqual({ exact: 'enviado', email: 'enviado', ads: 'falhou' })
    expect(sqls().some((s) => /uploaded_to_ads = true/.test(s))).toBe(false)
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: expect.objectContaining({ passo: 'ads' }) }),
    )
  })

  it('Ads que lança também não derruba nada', async () => {
    tokenAdsMock.mockRejectedValue(new Error('invalid_grant'))
    expect((await processarPosGravacao(linha(), 'acao')).ads).toBe('falhou')
  })

  it('Exact que lança não impede e-mail nem Ads', async () => {
    pushLeadMock.mockRejectedValue(new Error('timeout'))
    expect(await processarPosGravacao(linha(), 'acao')).toEqual({
      exact: 'falhou',
      email: 'enviado',
      ads: 'enviado',
    })
  })

  it('gbraid sobe com o tipo próprio', async () => {
    await processarPosGravacao(
      linha({}, { 'origem — Tipo do clique (Google Ads)': 'gbraid' }),
      'acao',
    )
    const eventos = ingerirMock.mock.calls[0]?.[3] as { tipoDeClique: string }[] // as: argumento de mock é unknown
    expect(eventos[0]?.tipoDeClique).toBe('gbraid')
  })

  it('sem clique do Google não chama o Ads; sem config, também não', async () => {
    expect((await processarPosGravacao(linha({ gclid: null }), 'acao')).ads).toBe('sem_clique')
    configAdsMock.mockReturnValue(null)
    expect((await processarPosGravacao(linha(), 'acao')).ads).toBe('sem_configuracao')
  })

  it('sem e-mail do lead, só a notificação interna sai', async () => {
    const semEmail = linha()
    delete semEmail.data.email
    await processarPosGravacao(semEmail, 'acao')
    expect(sendMailMock).toHaveBeenCalledTimes(1)
  })

  it('sem destinatário interno: nada sai e a falha é registrada, não silenciosa', async () => {
    const resumo = await processarPosGravacao(linha({ notificado_para: null }), 'acao')
    expect(resumo.email).toBe('sem_destino')
    expect(sendMailMock).not.toHaveBeenCalled()
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: expect.objectContaining({ passo: 'email' }) }),
    )
  })

  it('o evento do Sentry não leva telefone, e-mail nem nome (R8)', async () => {
    pushLeadMock.mockResolvedValue({ ok: false, error: 'Exact recusou Maria +5583999501388' })
    sendMailMock.mockResolvedValue({ ok: false, error: 'maria@example.com bounced' })
    ingerirMock.mockResolvedValue({ ok: false, status: 400, resposta: 'x' })
    await processarPosGravacao(linha(), 'acao')
    const evento = JSON.stringify(
      captureExceptionMock.mock.calls.map(([erro, ctx]) => [String(erro), ctx]),
    )
    expect(captureExceptionMock.mock.calls.length).toBeGreaterThanOrEqual(3)
    for (const pessoal of ['99950', 'maria@', 'Maria', 'Aurora'])
      expect(evento).not.toContain(pessoal)
    expect(evento).toContain('501')
  })

  it('erro lançado com dado pessoal na mensagem não chega ao Sentry', async () => {
    pushLeadMock.mockRejectedValue(new Error('falha para Maria maria@example.com +5583999501388'))
    await processarPosGravacao(linha(), 'acao')
    const evento = JSON.stringify(
      captureExceptionMock.mock.calls.map(([erro, ctx]) => [String(erro), ctx]),
    )
    for (const pessoal of ['99950', 'maria@', 'Maria']) expect(evento).not.toContain(pessoal)
  })
})
