import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { configurarRd, fetchRdEstrito, propostaRd, rdIds } from './helpers/rdstation'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/crm/rdstation/load-config', async () => ({
  obterConfigRd: async () => (await import('@/lib/crm/rdstation/config')).configRd(),
}))
vi.mock('@/lib/db', () => ({
  query: vi.fn(async () => ({
    rows: [{ access_token: 'token-teste', expires_at: new Date(Date.now() + 3600_000) }],
  })),
}))
const idSite = '6aeb7fd511accf002456177a'
const idUnidades = '6ada7ddaf4c5910029b675fc'

beforeEach(() => {
  vi.resetModules()
  configurarRd()
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

async function configuracao() {
  const { configRd } = await import('@/lib/crm/rdstation/config')
  return {
    ...configRd(),
    campos: {
      ...configRd().campos,
      quantidade_unidades: 'quantidade_unidades',
      tipo_condominio: 'tipo_condominio',
      participacao: 'participacao',
    },
    opcoes: {
      tipo_condominio: { Vertical: 'Vertical', Horizontal: 'Horizontal' },
      participacao: { 'Síndico(a)': 'Sindico Morador' },
    },
  }
}

it('env aceita IDs hash além de slugs e os três aliases opcionais', async () => {
  const { configRd } = await import('@/lib/crm/rdstation/config')
  vi.stubEnv(
    'RD_CRM_CUSTOM_FIELDS',
    JSON.stringify({
      ...configRd().campos,
      id_lead_site: idSite,
      quantidade_unidades: idUnidades,
      tipo_condominio: '6ada7d93541bff0028234cd2',
      participacao: '6ada80f1875aea00239dd97d',
    }),
  )
  expect(configRd().campos).toMatchObject({ id_lead_site: idSite, quantidade_unidades: idUnidades })
})

it('env lê opções configuradas, sem inventar correspondências', async () => {
  vi.stubEnv('RD_CRM_OPCOES_CAMPOS', '{"participacao":{"Síndico(a)":"Sindico Morador"}}')
  const { configRd } = await import('@/lib/crm/rdstation/config')
  expect(configRd().opcoes).toEqual({ participacao: { 'Síndico(a)': 'Sindico Morador' } })
})

it.each([
  'Síndico(a)',
  'Morador(a)',
])('opção vazia explícita para %s omite participação e preserva texto, sem usar default', async (cargo) => {
  vi.stubEnv('RD_CRM_OPCOES_CAMPOS', JSON.stringify({ participacao: { [cargo]: '' } }))
  const { configRd } = await import('@/lib/crm/rdstation/config')
  const { negocioRd } = await import('@/lib/crm/rdstation/map-lead')
  const cfg = configRd()
  cfg.campos.participacao = 'participacao'
  expect(cfg.opcoes.participacao?.[cargo]).toBe('')
  const campos = negocioRd('proposta', { ...propostaRd, cargo }, '42', cfg).custom_fields
  expect(campos).not.toHaveProperty('participacao')
  expect(campos.dados_proposta).toContain(`cargo: ${cargo}`)
})

it('mapa explícito sem a chave mantém omissão atual, sem mesclar com default', async () => {
  vi.stubEnv('RD_CRM_OPCOES_CAMPOS', '{"participacao":{"Outro":"Outros"}}')
  const { configRd } = await import('@/lib/crm/rdstation/config')
  const { negocioRd } = await import('@/lib/crm/rdstation/map-lead')
  const cfg = configRd()
  cfg.campos.participacao = 'participacao'
  for (const cargo of ['Síndico(a)', 'Morador(a)']) {
    expect(cfg.opcoes.participacao?.[cargo]).toBeUndefined()
    const campos = negocioRd('proposta', { ...propostaRd, cargo }, '42', cfg).custom_fields
    expect(campos).not.toHaveProperty('participacao')
    expect(campos.dados_proposta).toContain(`cargo: ${cargo}`)
  }
})

const cargosAtuais = [
  ['Síndico(a)', undefined],
  ['Conselheiro(a)', 'Conselheiro'],
  ['Morador(a)', 'Condômino'],
  ['Incorporador(a) / Construtora', 'Construtora'],
  ['Outro', 'Outros'],
] as const

it('cobre todos os cargos reais do form e não presume geometria', async () => {
  const { propostaSchema } = await import('@/lib/form-schemas')
  expect(propostaSchema.shape.cargo.unwrap().options).toEqual(cargosAtuais.map(([cargo]) => cargo))
  const { configRd } = await import('@/lib/crm/rdstation/config')
  expect(configRd().opcoes.tipo_condominio).toBeUndefined()
  expect(configRd().opcoes.participacao).not.toHaveProperty('Síndico(a)')
})

it.each(cargosAtuais)('default do cargo %s preserva o texto exato %s', async (cargo, esperado) => {
  const { configRd } = await import('@/lib/crm/rdstation/config')
  const { negocioRd } = await import('@/lib/crm/rdstation/map-lead')
  const cfg = configRd()
  cfg.campos.participacao = 'participacao'
  const campos = negocioRd('proposta', { ...propostaRd, cargo }, '42', cfg).custom_fields
  if (esperado) {
    expect(campos.participacao).toBe(esperado)
    expect(campos.dados_proposta).not.toContain('cargo:')
  } else {
    expect(campos).not.toHaveProperty('participacao')
    expect(campos.dados_proposta).toContain(`cargo: ${cargo}`)
  }
})

it.each([
  'Sindico Morador',
  'Sindico Profissional',
  'Sub - Síndico',
  'Conselheiro',
  'Condômino',
  'Construtora',
  'Outros',
])('mapa explícito preserva a opção real %s sem normalizar acento/espaços', async (opcao) => {
  vi.stubEnv('RD_CRM_OPCOES_CAMPOS', JSON.stringify({ participacao: { 'Síndico(a)': opcao } }))
  const { configRd } = await import('@/lib/crm/rdstation/config')
  const { negocioRd } = await import('@/lib/crm/rdstation/map-lead')
  const cfg = configRd()
  cfg.campos.participacao = 'participacao'
  expect(
    negocioRd('proposta', { ...propostaRd, cargo: 'Síndico(a)' }, '42', cfg).custom_fields
      .participacao,
  ).toBe(opcao)
})

it('mapa explícito substitui default e vazio o desliga; cargo desconhecido não vira Outros', async () => {
  const { configRd } = await import('@/lib/crm/rdstation/config')
  const { negocioRd } = await import('@/lib/crm/rdstation/map-lead')
  vi.stubEnv('RD_CRM_OPCOES_CAMPOS', '{"participacao":{}}')
  const cfg = configRd()
  cfg.campos.participacao = 'participacao'
  const desativado = negocioRd(
    'proposta',
    { ...propostaRd, cargo: 'Morador(a)' },
    '42',
    cfg,
  ).custom_fields
  expect(desativado).not.toHaveProperty('participacao')
  expect(desativado.dados_proposta).toContain('cargo: Morador(a)')
  vi.stubEnv('RD_CRM_OPCOES_CAMPOS', '{}')
  const desconhecido = negocioRd('proposta', { ...propostaRd, cargo: 'Gestor externo' }, '42', {
    ...configRd(),
    campos: cfg.campos,
  }).custom_fields
  expect(desconhecido).not.toHaveProperty('participacao')
  expect(desconhecido.dados_proposta).toContain('cargo: Gestor externo')
})

it('banco aceita novos aliases por ID e mapas opcionais no contrato versão 1', async () => {
  const { configRdDoBanco } = await import('@/lib/crm/rdstation/config')
  const cfg = await configuracao()
  const raw = {
    schema_version: 1,
    version: 2,
    pipeline_id: rdIds.pipeline,
    entry_stage_id: rdIds.stage,
    source_site_id: null,
    source_anuncio_id: null,
    campaign_site_id: null,
    campaign_anuncio_id: null,
    distribution_rule: null,
    unidades_por_cidade: {},
    custom_fields: {
      id_lead_site: idSite,
      quantidade_unidades: idUnidades,
      participacao: 'participacao',
      tipo_condominio: 'tipo_condominio',
    },
    opcoes_campos: cfg.opcoes,
    updated_by: null,
    updated_at: '2026-11-04T18:00:00Z',
  }
  expect(configRdDoBanco(raw)).toMatchObject({ campos: raw.custom_fields, opcoes: cfg.opcoes })
  expect(
    configRdDoBanco({
      ...raw,
      custom_fields: {
        ...raw.custom_fields,
        funcionarios: 'funcionarios',
        elevadores: 'elevadores',
        valor_taxa: 'valor_taxa',
        taxa_extra: 'taxa_extra',
        ja_cliente: 'ja_cliente',
        cidade: 'cidade',
        cnpj: 'cnpj',
      },
    }).campos,
  ).toHaveProperty('funcionarios', 'funcionarios')
  expect(configRdDoBanco({ ...raw, opcoes_campos: undefined }).opcoes).toEqual({
    participacao: {
      'Conselheiro(a)': 'Conselheiro',
      'Morador(a)': 'Condômino',
      'Incorporador(a) / Construtora': 'Construtora',
      Outro: 'Outros',
    },
  })
  expect(configRdDoBanco({ ...raw, opcoes_campos: {} }).opcoes).toEqual(
    configRdDoBanco({ ...raw, opcoes_campos: undefined }).opcoes,
  )
  expect(configRdDoBanco({ ...raw, opcoes_campos: { participacao: {} } }).opcoes).toEqual({
    participacao: {},
  })
  expect(() => configRdDoBanco({ ...raw, opcoes_campos: { participacao: { Outro: 1 } } })).toThrow(
    'inválida',
  )
  const semPreencher = configRdDoBanco({
    ...raw,
    custom_fields: { ...raw.custom_fields, dados_proposta: 'dados_proposta' },
    opcoes_campos: {
      participacao: { 'Síndico(a)': '' },
      tipo_condominio: { 'Condomínio residencial': '' },
    },
  })
  expect(semPreencher.opcoes.participacao).toEqual({ 'Síndico(a)': '' })
  const { negocioRd } = await import('@/lib/crm/rdstation/map-lead')
  const payload = negocioRd(
    'proposta',
    { ...propostaRd, cargo: 'Síndico(a)', tipo: 'Condomínio residencial' },
    '42',
    semPreencher,
  )
  expect(payload.custom_fields).not.toHaveProperty('participacao')
  expect(payload.custom_fields).not.toHaveProperty('tipo_condominio')
  expect(payload.custom_fields.dados_proposta).toContain('cargo: Síndico(a)')
  expect(payload.custom_fields.dados_proposta).toContain('tipo: Condomínio residencial')
})

it('quantidade é número e escolhas válidas saem do texto residual', async () => {
  const { negocioRd } = await import('@/lib/crm/rdstation/map-lead')
  const payload = negocioRd(
    'proposta',
    {
      ...propostaRd,
      unidades: '120',
      tipo: 'Vertical',
      cargo: 'Síndico(a)',
      mensagem: 'Quero proposta',
    },
    '42',
    await configuracao(),
  )
  expect(payload.custom_fields).toMatchObject({
    quantidade_unidades: 120,
    tipo_condominio: 'Vertical',
    participacao: 'Sindico Morador',
    dados_proposta: 'Formulário: proposta\nmensagem: Quero proposta',
  })
})

it('escolhas sem correspondência ficam vazias e preservadas em dados_proposta', async () => {
  const { negocioRd } = await import('@/lib/crm/rdstation/map-lead')
  const campos = negocioRd(
    'proposta',
    {
      ...propostaRd,
      tipo: 'Condomínio residencial',
      cargo: 'Morador(a)',
      mensagem: 'Texto',
    },
    '42',
    await configuracao(),
  ).custom_fields
  expect(campos).not.toHaveProperty('tipo_condominio')
  expect(campos).not.toHaveProperty('participacao')
  expect(campos.dados_proposta).toContain('tipo: Condomínio residencial')
  expect(campos.dados_proposta).toContain('cargo: Morador(a)')
  expect(campos.dados_proposta).toContain('mensagem: Texto')
})

it.each([
  '',
  '12x',
  '-1',
  '1.5',
  '9007199254740992',
])('quantidade inválida %s não vira número inventado', async (unidades) => {
  const { negocioRd } = await import('@/lib/crm/rdstation/map-lead')
  const campos = negocioRd(
    'proposta',
    { ...propostaRd, unidades },
    '42',
    await configuracao(),
  ).custom_fields
  expect(campos).not.toHaveProperty('quantidade_unidades')
  if (unidades) expect(campos.dados_proposta).toContain(`unidades: ${unidades}`)
})

it('sem alias estruturado configurado, preserva unidades e cargo no texto', async () => {
  const { configRd } = await import('@/lib/crm/rdstation/config')
  const { negocioRd } = await import('@/lib/crm/rdstation/map-lead')
  const campos = negocioRd(
    'proposta',
    { ...propostaRd, unidades: '48', cargo: 'Síndico(a)' },
    '42',
    configRd(),
  ).custom_fields
  expect(campos.dados_proposta).toContain('unidades: 48')
  expect(campos.dados_proposta).toContain('cargo: Síndico(a)')
})

it('ID resolve para slug no payload numérico, com cache até a fronteira de 60s', async () => {
  let agora = 1_000
  vi.spyOn(Date, 'now').mockImplementation(() => agora)
  const config = await configuracao()
  config.campos.quantidade_unidades = idUnidades
  const http = fetchRdEstrito(
    [1, 2].map(() => ({
      method: 'GET',
      path: 'custom_fields',
      filtro: 'entity:deal',
      resposta: { data: [{ id: idUnidades, slug: 'qtd_unidades_rd', entity: 'deal' }] },
    })),
  )
  const { resolverCamposRd } = await import('@/lib/crm/rdstation/resolve-fields')
  const { negocioRd } = await import('@/lib/crm/rdstation/map-lead')
  const resolvida = await resolverCamposRd('token-teste', config)
  expect(
    negocioRd('proposta', { ...propostaRd, unidades: '30' }, '42', resolvida).custom_fields
      .qtd_unidades_rd,
  ).toBe(30)
  agora += 59_999
  await resolverCamposRd('token-teste', config)
  expect(http.fetchMock).toHaveBeenCalledOnce()
  agora += 1
  await resolverCamposRd('token-teste', config)
  http.conferir()
})

it('catálogo paginado resolve ID somente na segunda página, sem seguir URL externa', async () => {
  const cfg = await configuracao()
  cfg.campos.id_lead_site = idSite
  const http = fetchRdEstrito([
    {
      method: 'GET',
      path: 'custom_fields',
      filtro: 'entity:deal',
      resposta: { data: [], links: { next: 'https://exemplo-invalido.test/pagina' } },
    },
    {
      method: 'GET',
      path: 'custom_fields',
      filtro: 'entity:deal',
      resposta: { data: [{ id: idSite, slug: 'site_id', entity: 'deal' }] },
    },
  ])
  const { resolverCamposRd } = await import('@/lib/crm/rdstation/resolve-fields')
  expect((await resolverCamposRd('token-teste', cfg)).campos.id_lead_site).toBe('site_id')
  expect(new URL(String(http.fetchMock.mock.calls[1][0])).searchParams.get('page[number]')).toBe(
    '2',
  )
  http.conferir()
})

it('ID ausente bloqueia envio real antes de marcar/criar card', async () => {
  const { configRd } = await import('@/lib/crm/rdstation/config')
  vi.stubEnv('RD_CRM_CUSTOM_FIELDS', JSON.stringify({ ...configRd().campos, id_lead_site: idSite }))
  const http = fetchRdEstrito([
    { method: 'GET', path: 'custom_fields', filtro: 'entity:deal', resposta: { data: [] } },
  ])
  const { pushLeadToRd } = await import('@/lib/crm/rdstation/push-lead')
  const antesDoPost = vi.fn(async () => {})
  await expect(
    pushLeadToRd('proposta', propostaRd, '42', {
      contactId: null,
      postIniciado: false,
      antesDoPost,
      rejeitado: vi.fn(async () => {}),
    }),
  ).rejects.toThrow('sem slug único')
  expect(antesDoPost).not.toHaveBeenCalled()
  http.conferir()
})

it('ID e slug que apontam para o mesmo campo são rejeitados', async () => {
  const cfg = await configuracao()
  cfg.campos.id_lead_site = idSite
  cfg.campos.participacao = 'site_id'
  const http = fetchRdEstrito([
    {
      method: 'GET',
      path: 'custom_fields',
      filtro: 'entity:deal',
      resposta: { data: [{ id: idSite, slug: 'site_id', entity: 'deal' }] },
    },
  ])
  const { resolverCamposRd } = await import('@/lib/crm/rdstation/resolve-fields')
  await expect(resolverCamposRd('token-teste', cfg)).rejects.toThrow('mesmo campo')
  http.conferir()
})

it('idempotência usa @slug resolvido do ID da UI e não faz POST ao achar card', async () => {
  const { configRd } = await import('@/lib/crm/rdstation/config')
  vi.stubEnv('RD_CRM_CUSTOM_FIELDS', JSON.stringify({ ...configRd().campos, id_lead_site: idSite }))
  const http = fetchRdEstrito([
    {
      method: 'GET',
      path: 'custom_fields',
      filtro: 'entity:deal',
      resposta: { data: [{ id: idSite, slug: 'id_site_v2', entity: 'deal' }] },
    },
    {
      method: 'GET',
      path: 'deals',
      filtro: '@id_site_v2:"42"',
      resposta: { data: [{ id: rdIds.deal }] },
    },
  ])
  const { pushLeadToRd } = await import('@/lib/crm/rdstation/push-lead')
  const antesDoPost = vi.fn(async () => {})
  expect(
    await pushLeadToRd('proposta', propostaRd, '42', {
      contactId: null,
      postIniciado: false,
      antesDoPost,
      rejeitado: vi.fn(async () => {}),
    }),
  ).toEqual({ dealId: rdIds.deal, contactId: null })
  expect(antesDoPost).not.toHaveBeenCalled()
  http.conferir()
})

it.each([
  { data: [] },
  { data: [{ id: idSite, entity: 'deal' }] },
  { data: [{ id: idSite, slug: 'id_site', entity: 'contact' }] },
])('catálogo sem slug de negociação falha antes de buscar/criar card', async (resposta) => {
  const config = await configuracao()
  config.campos.id_lead_site = idSite
  const http = fetchRdEstrito([
    { method: 'GET', path: 'custom_fields', filtro: 'entity:deal', resposta },
  ])
  const { resolverCamposRd } = await import('@/lib/crm/rdstation/resolve-fields')
  await expect(resolverCamposRd('token-teste', config)).rejects.toThrow(/slug/)
  http.conferir()
})
