import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configurarRd, fetchRdEstrito, type PassoRd, propostaRd, rdIds } from './helpers/rdstation'

vi.mock('server-only', () => ({}))
// Este arquivo cobre a API/payload; a leitura real e os fallbacks ficam em rdstation-config.
vi.mock('@/lib/crm/rdstation/load-config', async () => ({
  obterConfigRd: async () => (await import('@/lib/crm/rdstation/config')).configRd(),
}))
const warningContato = vi.fn()
vi.mock('@sentry/nextjs', () => ({
  captureMessage: (...args: unknown[]) => warningContato(...args),
  flush: vi.fn().mockResolvedValue(true),
}))
const queryMock = vi.fn()
vi.mock('@/lib/db', () => ({ query: (...args: unknown[]) => queryMock(...args) }))
const { configRd } = await import('@/lib/crm/rdstation/config')
const { contatoRd, negocioRd } = await import('@/lib/crm/rdstation/map-lead')
const { obterTokenRd } = await import('@/lib/crm/rdstation/token')
const { pushLeadToRd } = await import('@/lib/crm/rdstation/push-lead')
const { camposDaOrigem } = await import('@/lib/origemDoLead')

beforeEach(() => {
  vi.resetAllMocks()
  configurarRd()
  queryMock.mockResolvedValue({
    rows: [{ access_token: 'token-teste', expires_at: new Date(Date.now() + 3600_000) }],
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

const buscarDeal: PassoRd = {
  method: 'GET',
  path: 'deals',
  filtro: '@id_lead_site:"42"',
  resposta: { data: [] },
}
const etapa: PassoRd = {
  method: 'GET',
  path: `pipelines/${rdIds.pipeline}/stages/${rdIds.stage}`,
  resposta: { data: { id: rdIds.stage } },
}
const buscarEmail: PassoRd = {
  method: 'GET',
  path: 'contacts',
  filtro: 'email:"maria@example.com"',
  resposta: { data: [{ id: rdIds.contact }] },
}

function estado(postIniciado = false) {
  return {
    contactId: null,
    postIniciado,
    antesDoPost: vi.fn().mockResolvedValue(undefined),
    rejeitado: vi.fn().mockResolvedValue(undefined),
  }
}

describe('payload RD v2', () => {
  it('usa etapa, distribuição e campos de atribuição individuais da proposta', () => {
    const data = {
      ...propostaRd,
      'origem — utm_source': 'google',
      'origem — utm_medium': 'cpc',
      'origem — utm_campaign': 'Recife',
      'origem — utm_term': 'síndico',
      'origem — utm_content': 'A',
      'origem — gclid (Google Ads)': 'clique',
      'origem — Tipo do clique (Google Ads)': 'gbraid',
      'origem — Página de entrada': '/recife',
    }
    expect(negocioRd('proposta', data, '42', configRd())).toMatchObject({
      status: 'ongoing',
      stage_id: rdIds.stage,
      source_id: rdIds.sourceAnuncio,
      campaign_id: rdIds.campaignAnuncio,
      distribution_settings: { stage_id: rdIds.stage, rule: { type: 'all_users' } },
      custom_fields: {
        id_lead_site: '42',
        unidade_semog: 'Recife',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'Recife',
        utm_term: 'síndico',
        utm_content: 'A',
        gclid: 'clique',
        tipo_clique: 'gbraid',
        pagina_entrada: '/recife',
      },
    })
    expect(negocioRd('proposta', propostaRd, '42', configRd())).not.toHaveProperty('pipeline_id')
    expect(contatoRd(propostaRd)).toMatchObject({
      emails: [{ email: 'maria@example.com' }],
      phones: [{ phone: '+5581999991234', type: 'mobile' }],
    })
  })
  it('orgânico usa Site; tráfego pago sem gclid usa Anúncio', () => {
    expect(negocioRd('proposta', propostaRd, '42', configRd())).toMatchObject({
      source_id: rdIds.sourceSite,
      campaign_id: rdIds.campaignSite,
    })
    expect(
      negocioRd(
        'proposta',
        { ...propostaRd, 'origem — Canal (origem)': 'Tráfego pago (Meta)' },
        '42',
        configRd(),
      ),
    ).toHaveProperty('source_id', rdIds.sourceAnuncio)
  })
  it('Outra cidade segue sem Unidade Semog; configuração incompleta continua sendo erro', () => {
    expect(
      negocioRd('proposta', { ...propostaRd, cidade: 'Outra cidade' }, '42', configRd())
        .custom_fields,
    ).not.toHaveProperty('unidade_semog')
    expect(() =>
      negocioRd('proposta', { ...propostaRd, cidade: 'Belém e região' }, '42', configRd()),
    ).toThrow('cidade')
    vi.stubEnv('RD_CRM_STAGE_ID', '')
    expect(() => configRd()).toThrow('configuração ausente')
  })
  it('env sem RD_CRM_EQUIPES_POR_UNIDADE mantém a regra padrão e o mapa vazio', () => {
    expect(configRd().equipesPorUnidade).toEqual({})
    expect(negocioRd('proposta', propostaRd, '42', configRd())).toHaveProperty(
      'distribution_settings',
      { stage_id: rdIds.stage, rule: { type: 'all_users' } },
    )
  })
  it('env com equipe da Unidade distribui para o time; Outra cidade segue a regra padrão', () => {
    const equipe = 'abcdef0123456789abcdef01'
    vi.stubEnv('RD_CRM_EQUIPES_POR_UNIDADE', JSON.stringify({ Recife: equipe }))
    expect(negocioRd('proposta', propostaRd, '42', configRd())).toHaveProperty(
      'distribution_settings',
      { stage_id: rdIds.stage, rule: { type: 'team', id: equipe } },
    )
    expect(
      negocioRd('proposta', { ...propostaRd, cidade: 'Outra cidade' }, '42', configRd()),
    ).toHaveProperty('distribution_settings', {
      stage_id: rdIds.stage,
      rule: { type: 'all_users' },
    })
  })
  it('env com id de equipe inválido é erro de validação', () => {
    vi.stubEnv('RD_CRM_EQUIPES_POR_UNIDADE', '{"Recife":"ABCDEF0123456789ABCDEF01"}')
    expect(() => configRd()).toThrow()
  })
  it('persiste UTMs separadas a partir da origem validada, sem desmontar texto combinado', () => {
    const first = {
      source: 'google',
      medium: 'cpc',
      campaign: 'A · B',
      term: 'síndico',
      content: 'teste',
    }
    expect(camposDaOrigem({ fonte: 'cookie', atribuicao: { first, last: first } })).toEqual(
      expect.arrayContaining([
        { label: 'utm_source', value: 'google' },
        { label: 'utm_medium', value: 'cpc' },
        { label: 'utm_campaign', value: 'A · B' },
        { label: 'utm_term', value: 'síndico' },
        { label: 'utm_content', value: 'teste' },
      ]),
    )
  })
})

describe('token compartilhado sem OAuth refresh', () => {
  it.each([
    { rows: [] },
    { rows: [{ access_token: '', expires_at: new Date() }] },
    { rows: [{ access_token: 'x', expires_at: null }] },
  ])('recusa token ausente (%j)', async ({ rows }) => {
    const http = fetchRdEstrito([])
    queryMock.mockResolvedValue({ rows })
    await expect(pushLeadToRd('proposta', propostaRd, '42', estado())).rejects.toThrow(
      'token ausente',
    )
    expect(queryMock).toHaveBeenCalledWith(
      'select access_token, expires_at from cms.crm_rdstation_token_obter()',
    )
    http.conferir()
  })
  it.each([-1000, 30_000, 60_000])('recusa token expirado ou margem curta (%d)', async (tempo) => {
    queryMock.mockResolvedValue({
      rows: [{ access_token: 'x', expires_at: new Date(Date.now() + tempo) }],
    })
    await expect(obterTokenRd()).rejects.toThrow('expirado')
  })
})

describe('contato, negociação e idempotência com fetch estrito', () => {
  it('reaproveita contato por e-mail e cria negociação com envelope data', async () => {
    const body = {
      ...negocioRd('proposta', propostaRd, '42', configRd()),
      contact_ids: [rdIds.contact],
    }
    const http = fetchRdEstrito([
      buscarDeal,
      etapa,
      buscarEmail,
      { method: 'POST', path: 'deals', body, resposta: { data: { id: rdIds.deal } }, status: 201 },
    ])
    const prazo = vi.spyOn(AbortSignal, 'timeout')
    const registro = estado()
    expect(await pushLeadToRd('proposta', propostaRd, '42', registro)).toEqual({
      dealId: rdIds.deal,
      contactId: rdIds.contact,
    })
    expect(prazo).toHaveBeenCalledWith(8000)
    expect(registro.antesDoPost).toHaveBeenCalledWith(rdIds.contact)
    expect(registro.antesDoPost.mock.invocationCallOrder[0]).toBeLessThan(
      http.fetchMock.mock.invocationCallOrder[3],
    )
    http.conferir()
  })
  it('busca por telefone quando e-mail não existe, sem criar contato duplicado', async () => {
    const http = fetchRdEstrito([
      buscarDeal,
      etapa,
      { ...buscarEmail, resposta: { data: [] } },
      {
        method: 'GET',
        path: 'contacts',
        filtro: 'phone:"+5581999991234"',
        resposta: { data: [{ id: rdIds.contact }] },
      },
      {
        method: 'POST',
        path: 'deals',
        body: {
          ...negocioRd('proposta', propostaRd, '42', configRd()),
          contact_ids: [rdIds.contact],
        },
        resposta: { data: { id: rdIds.deal } },
      },
    ])
    await pushLeadToRd('proposta', propostaRd, '42', estado())
    http.conferir()
  })
  it('cria contato quando as duas buscas estão vazias', async () => {
    const http = fetchRdEstrito([
      buscarDeal,
      etapa,
      { ...buscarEmail, resposta: { data: [] } },
      { method: 'GET', path: 'contacts', filtro: 'phone:"+5581999991234"', resposta: { data: [] } },
      {
        method: 'POST',
        path: 'contacts',
        body: contatoRd(propostaRd),
        resposta: { data: { id: rdIds.contact } },
      },
      {
        method: 'POST',
        path: 'deals',
        body: {
          ...negocioRd('proposta', propostaRd, '42', configRd()),
          contact_ids: [rdIds.contact],
        },
        resposta: { data: { id: rdIds.deal } },
      },
    ])
    await pushLeadToRd('proposta', propostaRd, '42', estado())
    http.conferir()
  })
  it('timeout após POST reconcilia pelo slug antes de qualquer nova criação', async () => {
    const body = {
      ...negocioRd('proposta', propostaRd, '42', configRd()),
      contact_ids: [rdIds.contact],
    }
    const http = fetchRdEstrito([
      buscarDeal,
      etapa,
      buscarEmail,
      { method: 'POST', path: 'deals', body, timeout: true },
      { ...buscarDeal, resposta: { data: [{ id: rdIds.deal, contact_ids: [rdIds.contact] }] } },
    ])
    const registro = estado()
    await expect(pushLeadToRd('proposta', propostaRd, '42', registro)).rejects.toThrow(
      'falha de rede',
    )
    expect(registro.rejeitado).not.toHaveBeenCalled()
    expect(await pushLeadToRd('proposta', propostaRd, '42', estado(true))).toEqual({
      dealId: rdIds.deal,
      contactId: rdIds.contact,
    })
    http.conferir()
  })
  it('timeout com busca ainda vazia nunca repete POST (indexação atrasada)', async () => {
    const http = fetchRdEstrito([buscarDeal])
    await expect(pushLeadToRd('proposta', propostaRd, '42', estado(true))).rejects.toThrow(
      'aguardando conciliação',
    )
    http.conferir()
  })
  it('após 30min sem card recria automaticamente com o mesmo id_lead_site', async () => {
    const http = fetchRdEstrito([
      buscarDeal,
      etapa,
      buscarEmail,
      {
        method: 'POST',
        path: 'deals',
        body: {
          ...negocioRd('proposta', propostaRd, '42', configRd()),
          contact_ids: [rdIds.contact],
        },
        resposta: { data: { id: rdIds.deal } },
      },
    ])
    const registro = { ...estado(true), postIniciadoEm: new Date(Date.now() - 31 * 60_000) }
    expect(await pushLeadToRd('proposta', propostaRd, '42', registro)).toMatchObject({
      dealId: rdIds.deal,
      recriado: true,
    })
    http.conferir()
  })
  it.each([
    'ENOTFOUND',
    'ECONNREFUSED',
    'UND_ERR_CONNECT_TIMEOUT',
  ])('falha pré-envio %s libera marcador', async (erroRede) => {
    const http = fetchRdEstrito([
      buscarDeal,
      etapa,
      buscarEmail,
      {
        method: 'POST',
        path: 'deals',
        body: {
          ...negocioRd('proposta', propostaRd, '42', configRd()),
          contact_ids: [rdIds.contact],
        },
        erroRede,
      },
    ])
    const registro = estado()
    await expect(pushLeadToRd('proposta', propostaRd, '42', registro)).rejects.toThrow(
      'antes de enviar',
    )
    expect(registro.rejeitado).toHaveBeenCalledOnce()
    http.conferir()
  })
  it('resultado ambíguo na busca não cria negociação', async () => {
    const http = fetchRdEstrito([{ ...buscarDeal, resposta: { data: [{ id: 'A' }, { id: 'B' }] } }])
    await expect(pushLeadToRd('proposta', propostaRd, '42', estado())).rejects.toThrow('ids: A, B')
    http.conferir()
  })
  it('rejeição explícita 422 libera marcador para tentar payload corrigido', async () => {
    const http = fetchRdEstrito([
      buscarDeal,
      etapa,
      buscarEmail,
      {
        method: 'POST',
        path: 'deals',
        body: {
          ...negocioRd('proposta', propostaRd, '42', configRd()),
          contact_ids: [rdIds.contact],
        },
        status: 422,
      },
    ])
    const registro = estado()
    await expect(pushLeadToRd('proposta', propostaRd, '42', registro)).rejects.toThrow('422')
    expect(registro.rejeitado).toHaveBeenCalledOnce()
    http.conferir()
  })
})

describe('bordas de retry e contato duplicado', () => {
  it.each([
    ['email', buscarEmail],
    ['phone', { method: 'GET', path: 'contacts', filtro: 'phone:"+5581999991234"' }],
  ] as const)('contato duplicado por %s escolhe mais antigo mesmo fora de ordem', async (_tipo, busca) => {
    const passos: PassoRd[] = [buscarDeal, etapa]
    if (_tipo === 'phone') passos.push({ ...buscarEmail, resposta: { data: [] } })
    passos.push({
      ...busca,
      resposta: {
        data: [
          { id: 'novo', created_at: '2026-11-01T00:00:00Z' },
          { id: rdIds.contact, created_at: '2025-01-01T00:00:00Z' },
        ],
      },
    })
    passos.push({
      method: 'POST',
      path: 'deals',
      body: {
        ...negocioRd('proposta', propostaRd, '42', configRd()),
        contact_ids: [rdIds.contact],
      },
      resposta: { data: { id: rdIds.deal } },
    })
    const http = fetchRdEstrito(passos)
    expect(await pushLeadToRd('proposta', propostaRd, '42', estado())).toMatchObject({
      contactId: rdIds.contact,
    })
    expect(warningContato).toHaveBeenCalledWith(
      'contato duplicado no RD',
      expect.objectContaining({ level: 'warning' }),
    )
    http.conferir()
  })
  it.each([
    29 * 60_000 + 59_000,
    30 * 60_000,
  ])('fronteira exata de recriação com horário de início (%d)', async (idade) => {
    const agora = new Date('2026-11-04T12:00:00Z')
    vi.spyOn(Date, 'now').mockReturnValue(agora.getTime())
    const registro = { ...estado(true), postIniciadoEm: new Date(agora.getTime() - idade) }
    const passos: PassoRd[] = [buscarDeal]
    if (idade === 30 * 60_000)
      passos.push(etapa, buscarEmail, {
        method: 'POST',
        path: 'deals',
        body: {
          ...negocioRd('proposta', propostaRd, '42', configRd()),
          contact_ids: [rdIds.contact],
        },
        resposta: { data: { id: rdIds.deal } },
      })
    const http = fetchRdEstrito(passos)
    if (idade < 30 * 60_000)
      await expect(pushLeadToRd('proposta', propostaRd, '42', registro)).rejects.toThrow(
        'aguardando conciliação',
      )
    else
      expect(await pushLeadToRd('proposta', propostaRd, '42', registro)).toHaveProperty(
        'recriado',
        true,
      )
    http.conferir()
    vi.restoreAllMocks()
  })
  it('ECONNRESET mantém POST incerto, sem liberar marcador', async () => {
    const http = fetchRdEstrito([
      buscarDeal,
      etapa,
      buscarEmail,
      {
        method: 'POST',
        path: 'deals',
        body: {
          ...negocioRd('proposta', propostaRd, '42', configRd()),
          contact_ids: [rdIds.contact],
        },
        erroRede: 'ECONNRESET',
      },
    ])
    const registro = estado()
    await expect(pushLeadToRd('proposta', propostaRd, '42', registro)).rejects.toThrow(
      'falha de rede',
    )
    expect(registro.rejeitado).not.toHaveBeenCalled()
    http.conferir()
  })
  it.each([401, 429])('HTTP %d ao recriar preserva incerteza anterior', async (status) => {
    const http = fetchRdEstrito([
      buscarDeal,
      etapa,
      buscarEmail,
      {
        method: 'POST',
        path: 'deals',
        body: {
          ...negocioRd('proposta', propostaRd, '42', configRd()),
          contact_ids: [rdIds.contact],
        },
        status,
      },
    ])
    const registro = { ...estado(true), postIniciadoEm: new Date(Date.now() - 31 * 60_000) }
    await expect(pushLeadToRd('proposta', propostaRd, '42', registro)).rejects.toThrow(
      String(status),
    )
    expect(registro.rejeitado).not.toHaveBeenCalled()
    http.conferir()
  })
  it.each([
    null,
    'card-confirmado',
  ])('limite permite última busca, sem recriar (card anterior: %s)', async (dealId) => {
    const http = fetchRdEstrito([buscarDeal])
    await expect(
      pushLeadToRd('proposta', propostaRd, '42', {
        ...estado(true),
        dealId,
        podeCriar: false,
        postIniciadoEm: new Date(Date.now() - 31 * 60_000),
      }),
    ).rejects.toThrow('teto de 5')
    http.conferir()
  })
  it('asserção no fetch continua detectável mesmo engolida pelo catch da requisição', async () => {
    const http = fetchRdEstrito([{ ...buscarDeal, filtro: '@errado:"42"' }])
    await expect(pushLeadToRd('proposta', propostaRd, '42', estado())).rejects.toThrow(
      'falha de rede',
    )
    expect(http.violacoes).toHaveLength(1)
    expect(() => http.conferir()).toThrow('violações do contrato HTTP estrito')
  })
})
