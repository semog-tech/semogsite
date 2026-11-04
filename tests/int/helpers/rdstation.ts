import { expect, vi } from 'vitest'

export const rdIds = {
  pipeline: '111111111111111111111111',
  stage: '222222222222222222222222',
  sourceSite: '333333333333333333333333',
  sourceAnuncio: '444444444444444444444444',
  campaignSite: '555555555555555555555555',
  campaignAnuncio: '666666666666666666666666',
  contact: '777777777777777777777777',
  deal: '888888888888888888888888',
}

export function configurarRd() {
  vi.stubEnv('CRM_PROVIDER', 'rdstation')
  vi.stubEnv('RD_CRM_PIPELINE_ID', rdIds.pipeline)
  vi.stubEnv('RD_CRM_STAGE_ID', rdIds.stage)
  vi.stubEnv('RD_CRM_SOURCE_SITE_ID', rdIds.sourceSite)
  vi.stubEnv('RD_CRM_SOURCE_ANUNCIO_ID', rdIds.sourceAnuncio)
  vi.stubEnv('RD_CRM_CAMPAIGN_SITE_ID', rdIds.campaignSite)
  vi.stubEnv('RD_CRM_CAMPAIGN_ANUNCIO_ID', rdIds.campaignAnuncio)
  vi.stubEnv('RD_CRM_DISTRIBUTION_RULE', '{"type":"all_users"}')
  vi.stubEnv('RD_CRM_UNIDADES_POR_CIDADE', '{"Recife e região":"Recife"}')
  vi.stubEnv(
    'RD_CRM_CUSTOM_FIELDS',
    JSON.stringify({
      id_lead_site: 'id_lead_site',
      unidade_semog: 'unidade_semog',
      utm_source: 'utm_source',
      utm_medium: 'utm_medium',
      utm_campaign: 'utm_campaign',
      utm_term: 'utm_term',
      utm_content: 'utm_content',
      gclid: 'gclid',
      tipo_clique: 'tipo_clique',
      pagina_entrada: 'pagina_entrada',
      dados_proposta: 'dados_proposta',
    }),
  )
}

export type PassoRd = {
  method: 'GET' | 'POST'
  path: string
  filtro?: string
  body?: unknown
  resposta?: unknown
  status?: number
  timeout?: boolean
  erroRede?: string
}

/** Qualquer chamada extra, URL errada, falta de Bearer ou payload diferente falha. */
export function fetchRdEstrito(passos: PassoRd[]) {
  let indice = 0
  const violacoes: unknown[] = []
  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    let passo: PassoRd
    try {
      passo = passos[indice++]
      expect(passo, 'chamada HTTP imprevista').toBeDefined()
      const url = new URL(String(input))
      expect(url.origin).toBe('https://api.rd.services')
      expect(url.pathname).toBe(`/crm/v2/${passo.path}`)
      expect(init?.method).toBe(passo.method)
      expect(init?.headers).toEqual({
        Authorization: 'Bearer token-teste',
        'Content-Type': 'application/json',
      })
      expect(init?.signal).toBeDefined()
      expect(init?.cache).toBe('no-store')
      if (passo.filtro) expect(url.searchParams.get('filter')).toBe(passo.filtro)
      else expect(url.search).toBe('')
      if (passo.body) expect(JSON.parse(String(init?.body))).toEqual({ data: passo.body })
      else expect(init?.body).toBeUndefined()
    } catch (err) {
      violacoes.push(err)
      throw err
    }
    if (passo.timeout) throw new DOMException('Tempo esgotado', 'TimeoutError')
    if (passo.erroRede) throw new TypeError('fetch failed', { cause: { code: passo.erroRede } })
    return new Response(JSON.stringify(passo.resposta ?? {}), {
      status: passo.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return {
    fetchMock,
    violacoes,
    conferir: () => {
      expect(violacoes, 'violações do contrato HTTP estrito').toEqual([])
      expect(indice).toBe(passos.length)
    },
  }
}

export const propostaRd = {
  nome: 'Maria',
  nomeCondominio: 'Residencial Aurora',
  telefone: '+5581999991234',
  email: 'maria@example.com',
  cidade: 'Recife e região',
}
