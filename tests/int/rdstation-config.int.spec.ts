import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configurarRd, fetchRdEstrito, propostaRd, rdIds } from './helpers/rdstation'

vi.mock('server-only', () => ({}))
const queryMock = vi.fn()
const sentryMock = vi.fn()
vi.mock('@/lib/db', () => ({ query: (...args: unknown[]) => queryMock(...args) }))
vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => sentryMock(...args),
  flush: vi.fn().mockResolvedValue(true),
}))

beforeEach(() => {
  vi.resetModules()
  vi.resetAllMocks()
  configurarRd()
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

async function fixture() {
  const { configRd } = await import('@/lib/crm/rdstation/config')
  return {
    schema_version: 1,
    version: 1,
    pipeline_id: rdIds.pipeline,
    entry_stage_id: rdIds.stage,
    source_site_id: rdIds.sourceSite,
    source_anuncio_id: rdIds.sourceAnuncio,
    campaign_site_id: rdIds.campaignSite,
    campaign_anuncio_id: rdIds.campaignAnuncio,
    distribution_rule: { type: 'all_users' },
    unidades_por_cidade: { 'Recife e região': 'Recife' },
    custom_fields: configRd().campos,
    updated_by: null,
    updated_at: '2026-11-04T12:00:00+00:00',
  }
}

describe('configuração RD do banco com cache e fallback explícito', () => {
  it('NULL usa env legado e mantém cache por 60s', async () => {
    queryMock.mockResolvedValue({ rows: [{ config: null }] })
    const { obterConfigRd } = await import('@/lib/crm/rdstation/load-config')
    expect(await obterConfigRd()).toMatchObject({
      pipelineId: rdIds.pipeline,
      campos: { id_lead_site: 'id_lead_site' },
    })
    expect(await obterConfigRd()).toMatchObject({ pipelineId: rdIds.pipeline })
    expect(queryMock).toHaveBeenCalledOnce()
    expect(queryMock).toHaveBeenCalledWith('select cms.crm_rdstation_config_obter() as config')
    expect(sentryMock).not.toHaveBeenCalled()
  })
  it('config do banco vence env e é relida na fronteira de 60s', async () => {
    const cfg = await fixture()
    const novoPipeline = 'aaaaaaaaaaaaaaaaaaaaaaaa'
    let agora = 100_000
    vi.spyOn(Date, 'now').mockImplementation(() => agora)
    queryMock
      .mockResolvedValueOnce({ rows: [{ config: { ...cfg, pipeline_id: novoPipeline } }] })
      .mockResolvedValueOnce({ rows: [{ config: { ...cfg, version: 2 } }] })
    const { obterConfigRd } = await import('@/lib/crm/rdstation/load-config')
    expect((await obterConfigRd()).pipelineId).toBe(novoPipeline)
    agora += 59_999
    expect((await obterConfigRd()).pipelineId).toBe(novoPipeline)
    expect(queryMock).toHaveBeenCalledOnce()
    agora += 1
    expect((await obterConfigRd()).pipelineId).toBe(rdIds.pipeline)
    expect(queryMock).toHaveBeenCalledTimes(2)
  })
  it('schema_version desconhecida falha explicitamente, mesmo com cache bom e env válido', async () => {
    const cfg = await fixture()
    let agora = 100_000
    vi.spyOn(Date, 'now').mockImplementation(() => agora)
    queryMock
      .mockResolvedValueOnce({ rows: [{ config: cfg }] })
      .mockResolvedValueOnce({ rows: [{ config: { ...cfg, schema_version: 2 } }] })
    const { obterConfigRd } = await import('@/lib/crm/rdstation/load-config')
    await obterConfigRd()
    agora += 60_000
    await expect(obterConfigRd()).rejects.toThrow('schema_version')
  })
  it('versão inválida vira erro Sentry e permanece pendente no fluxo real do CRM', async () => {
    const cfg = { ...(await fixture()), schema_version: 9 }
    queryMock.mockImplementation(async (sql: string) => {
      if (sql.startsWith('with candidato')) return { rows: [{ crm_attempts: 0, pode_criar: true }] }
      if (sql.includes('config_obter')) return { rows: [{ config: cfg }] }
      return { rows: [{ id: '42' }] }
    })
    const http = fetchRdEstrito([])
    const { enviarLeadAoCrm } = await import('@/lib/crm/send-lead')
    expect(await enviarLeadAoCrm('proposta', propostaRd, '42')).toMatchObject({
      ok: false,
      error: expect.stringContaining('schema_version'),
    })
    expect(sentryMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('schema_version') }),
      expect.objectContaining({ level: 'error' }),
    )
    expect(queryMock.mock.calls.some(([sql]) => sql.includes("crm_status = 'enviado'"))).toBe(false)
    http.conferir()
  })
  it.each([
    'pipeline_id',
    'entry_stage_id',
    'id_lead_site',
    'campo_desconhecido',
  ])('JSON inválido em %s não cai para env', async (campo) => {
    const cfg = await fixture()
    const raw =
      campo === 'id_lead_site'
        ? { ...cfg, custom_fields: {} }
        : campo === 'campo_desconhecido'
          ? { ...cfg, extra: true }
          : { ...cfg, [campo]: null }
    queryMock.mockResolvedValue({ rows: [{ config: raw }] })
    const { obterConfigRd } = await import('@/lib/crm/rdstation/load-config')
    await expect(obterConfigRd()).rejects.toThrow('incompleta ou inválida')
  })
  it('falha da RPC usa última configuração boa, mesmo expirada, e registra Sentry', async () => {
    const cfg = await fixture()
    const pipeline = 'aaaaaaaaaaaaaaaaaaaaaaaa'
    let agora = 100_000
    vi.spyOn(Date, 'now').mockImplementation(() => agora)
    queryMock
      .mockResolvedValueOnce({ rows: [{ config: { ...cfg, pipeline_id: pipeline } }] })
      .mockRejectedValueOnce(new Error('RPC indisponível'))
    const { obterConfigRd } = await import('@/lib/crm/rdstation/load-config')
    await obterConfigRd()
    agora += 60_000
    expect((await obterConfigRd()).pipelineId).toBe(pipeline)
    expect(sentryMock).toHaveBeenCalledOnce()
    expect(sentryMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ extra: { fallback: 'cache' } }),
    )
  })
  it('falha da RPC sem cache usa env e registra Sentry', async () => {
    queryMock.mockRejectedValue(new Error('RPC indisponível'))
    const { obterConfigRd } = await import('@/lib/crm/rdstation/load-config')
    expect((await obterConfigRd()).pipelineId).toBe(rdIds.pipeline)
    expect(sentryMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ extra: { fallback: 'env' } }),
    )
  })
  it('fonte/campanha/distribuição NULL são omitidas; só id_lead_site é obrigatório nos aliases', async () => {
    const cfg = {
      ...(await fixture()),
      source_site_id: null,
      source_anuncio_id: null,
      campaign_site_id: null,
      campaign_anuncio_id: null,
      distribution_rule: null,
      custom_fields: { id_lead_site: 'id_novo' },
    }
    queryMock.mockResolvedValue({ rows: [{ config: cfg }] })
    const { obterConfigRd } = await import('@/lib/crm/rdstation/load-config')
    const { negocioRd } = await import('@/lib/crm/rdstation/map-lead')
    const payload: unknown = JSON.parse(
      JSON.stringify(negocioRd('proposta', propostaRd, '42', await obterConfigRd())),
    )
    expect(payload).not.toHaveProperty('source_id')
    expect(payload).not.toHaveProperty('campaign_id')
    expect(payload).not.toHaveProperty('distribution_settings')
    expect(payload).toHaveProperty('custom_fields', { id_novo: '42' })
  })
  it('slug alterado no banco chega à busca idempotente e ao POST real do deal', async () => {
    let agora = Date.now()
    vi.spyOn(Date, 'now').mockImplementation(() => agora)
    let cfg = await fixture()
    queryMock.mockImplementation(async (sql: string) =>
      sql.includes('config_obter')
        ? { rows: [{ config: cfg }] }
        : { rows: [{ access_token: 'token-teste', expires_at: new Date(Date.now() + 3600_000) }] },
    )
    const { obterConfigRd } = await import('@/lib/crm/rdstation/load-config')
    const { negocioRd } = await import('@/lib/crm/rdstation/map-lead')
    expect((await obterConfigRd()).campos.id_lead_site).toBe('id_lead_site')
    cfg = {
      ...cfg,
      version: 2,
      custom_fields: {
        ...cfg.custom_fields,
        id_lead_site: 'id_lead_site_novo',
        utm_source: 'utm_fonte_nova',
      },
    }
    agora += 60_000
    const data = { ...propostaRd, 'origem — utm_source': 'google' }
    const negocio = negocioRd('proposta', data, '42', await obterConfigRd())
    expect(negocio.custom_fields).toMatchObject({
      id_lead_site_novo: '42',
      utm_fonte_nova: 'google',
    })
    const http = fetchRdEstrito([
      { method: 'GET', path: 'deals', filtro: '@id_lead_site_novo:"42"', resposta: { data: [] } },
      {
        method: 'GET',
        path: `pipelines/${rdIds.pipeline}/stages/${rdIds.stage}`,
        resposta: { data: { id: rdIds.stage } },
      },
      {
        method: 'GET',
        path: 'contacts',
        filtro: 'email:"maria@example.com"',
        resposta: { data: [{ id: rdIds.contact }] },
      },
      {
        method: 'POST',
        path: 'deals',
        body: { ...negocio, contact_ids: [rdIds.contact] },
        resposta: { data: { id: rdIds.deal } },
      },
    ])
    const { pushLeadToRd } = await import('@/lib/crm/rdstation/push-lead')
    expect(
      await pushLeadToRd('proposta', data, '42', {
        contactId: null,
        postIniciado: false,
        antesDoPost: vi.fn().mockResolvedValue(undefined),
        rejeitado: vi.fn().mockResolvedValue(undefined),
      }),
    ).toHaveProperty('dealId', rdIds.deal)
    http.conferir()
  })
})

describe('distribuição por equipe da Unidade Semog (equipes_por_unidade)', () => {
  const equipeRecife = 'abcdef0123456789abcdef01'
  const equipeJoaoPessoa = '0123456789abcdef01234567'
  const unidades = { 'Recife e região': 'Recife', 'João Pessoa e região': 'João Pessoa' }

  async function negocioDoBanco(raw: unknown, data: Record<string, string> = propostaRd) {
    queryMock.mockResolvedValue({ rows: [{ config: raw }] })
    const { obterConfigRd } = await import('@/lib/crm/rdstation/load-config')
    const { negocioRd } = await import('@/lib/crm/rdstation/map-lead')
    const config = await obterConfigRd()
    return { config, negocio: negocioRd('proposta', data, '42', config) }
  }

  it('config sem a chave mantém o comportamento atual: mapa vazio e regra padrão', async () => {
    const cfg = await fixture()
    expect(cfg).not.toHaveProperty('equipes_por_unidade')
    const { config, negocio } = await negocioDoBanco(cfg)
    expect(config.equipesPorUnidade).toEqual({})
    expect(negocio.distribution_settings).toEqual({
      stage_id: rdIds.stage,
      rule: { type: 'all_users' },
    })
  })
  it('config com a chave expõe o mapa e envia a equipe da Unidade do lead', async () => {
    const equipes = { Recife: equipeRecife, 'João Pessoa': equipeJoaoPessoa }
    const cfg = {
      ...(await fixture()),
      unidades_por_cidade: unidades,
      equipes_por_unidade: equipes,
    }
    const { config, negocio } = await negocioDoBanco(cfg, {
      ...propostaRd,
      cidade: 'João Pessoa e região',
    })
    expect(config.equipesPorUnidade).toEqual(equipes)
    expect(negocio.distribution_settings).toEqual({
      stage_id: rdIds.stage,
      rule: { type: 'team', id: equipeJoaoPessoa },
    })
  })
  it('equipe da Unidade vale mesmo com distribution_rule NULL', async () => {
    const cfg = {
      ...(await fixture()),
      distribution_rule: null,
      equipes_por_unidade: { Recife: equipeRecife },
    }
    const { negocio } = await negocioDoBanco(cfg)
    expect(negocio.distribution_settings).toEqual({
      stage_id: rdIds.stage,
      rule: { type: 'team', id: equipeRecife },
    })
  })
  it('Unidade sem equipe usa a regra padrão', async () => {
    const cfg = {
      ...(await fixture()),
      unidades_por_cidade: unidades,
      equipes_por_unidade: { 'João Pessoa': equipeJoaoPessoa },
    }
    const { negocio } = await negocioDoBanco(cfg)
    expect(negocio.distribution_settings).toEqual({
      stage_id: rdIds.stage,
      rule: { type: 'all_users' },
    })
  })
  it('Unidade sem equipe e regra padrão NULL omite distribution_settings, como hoje', async () => {
    const cfg = {
      ...(await fixture()),
      distribution_rule: null,
      unidades_por_cidade: unidades,
      equipes_por_unidade: { 'João Pessoa': equipeJoaoPessoa },
    }
    const { negocio } = await negocioDoBanco(cfg)
    expect(JSON.parse(JSON.stringify(negocio))).not.toHaveProperty('distribution_settings')
  })
  it.each([
    'Outra cidade',
    '',
  ])('lead sem Unidade (cidade %j) usa a regra padrão', async (cidade) => {
    const cfg = { ...(await fixture()), equipes_por_unidade: { Recife: equipeRecife } }
    const { negocio } = await negocioDoBanco(cfg, { ...propostaRd, cidade })
    expect(negocio.distribution_settings).toEqual({
      stage_id: rdIds.stage,
      rule: { type: 'all_users' },
    })
  })
  it.each([
    ['maiúsculas', 'ABCDEF0123456789ABCDEF01'],
    ['23 caracteres', 'abcdef0123456789abcdef0'],
    ['não hex', 'zzzzzz0123456789abcdef01'],
    ['número', 123],
    ['null', null],
  ])('id de equipe inválido (%s) é erro de validação, sem fallback', async (_caso, idEquipe) => {
    const cfg = { ...(await fixture()), equipes_por_unidade: { Recife: idEquipe } }
    queryMock.mockResolvedValue({ rows: [{ config: cfg }] })
    const { obterConfigRd } = await import('@/lib/crm/rdstation/load-config')
    await expect(obterConfigRd()).rejects.toThrow('incompleta ou inválida')
    expect(sentryMock).not.toHaveBeenCalled()
  })
  it('equipes_por_unidade que não é objeto é erro de validação', async () => {
    const cfg = { ...(await fixture()), equipes_por_unidade: [equipeRecife] }
    queryMock.mockResolvedValue({ rows: [{ config: cfg }] })
    const { obterConfigRd } = await import('@/lib/crm/rdstation/load-config')
    await expect(obterConfigRd()).rejects.toThrow('incompleta ou inválida')
  })
  it('outra chave desconhecida continua rejeitada mesmo ao lado de equipes_por_unidade', async () => {
    const cfg = {
      ...(await fixture()),
      equipes_por_unidade: { Recife: equipeRecife },
      equipes_por_cidade: { 'Recife e região': equipeRecife },
    }
    queryMock.mockResolvedValue({ rows: [{ config: cfg }] })
    const { obterConfigRd } = await import('@/lib/crm/rdstation/load-config')
    await expect(obterConfigRd()).rejects.toThrow('incompleta ou inválida')
  })
})
