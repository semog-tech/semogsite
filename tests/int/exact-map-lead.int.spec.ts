import { describe, expect, it } from 'vitest'
import { isExactEligible, mapLead } from '@/lib/exact/map-lead'

/**
 * `mapLead` traduz o lead do site pro vocabulário do Exact. É função pura, e é
 * onde moram todas as decisões de mapeamento — por isso a cobertura densa aqui
 * e quase nenhuma no client HTTP.
 *
 * Contrato do Exact confirmado por probe em 2026-07-29 (ver
 * `scripts/probe-exact-create-lead.ts`): `source`/`industry` são STRINGS.
 */

const SDR = 'daiane@semog.com.br'

const propostaData: Record<string, string> = {
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

describe('isExactEligible', () => {
  it('proposta é sempre elegível', () => {
    expect(isExactEligible('proposta', propostaData)).toBe(true)
  })

  it('contato só é elegível com assunto proposta-comercial', () => {
    expect(isExactEligible('contato', { assunto: 'proposta-comercial' })).toBe(true)
    expect(isExactEligible('contato', { assunto: 'segunda-via-boleto' })).toBe(false)
    expect(isExactEligible('contato', {})).toBe(false)
  })
})

describe('mapLead — lead', () => {
  it('usa o nome do condomínio como nome do lead', () => {
    expect(mapLead('proposta', propostaData, SDR).lead.name).toBe('Residencial Aurora')
  })

  it('cai no nome da pessoa quando não há condomínio', () => {
    const { lead } = mapLead('proposta', { ...propostaData, nomeCondominio: '' }, SDR)
    expect(lead.name).toBe('Maria Souza')
  })

  it('quebra o E.164 em ddi + número nacional', () => {
    const { lead } = mapLead('proposta', propostaData, SDR)
    expect(lead.ddiPhone).toBe('55')
    expect(lead.phone).toBe('83999501388')
  })

  it('telefone ausente ou inválido não vira campo vazio', () => {
    const { lead } = mapLead('proposta', { ...propostaData, telefone: '' }, SDR)
    expect(lead.ddiPhone).toBeUndefined()
    expect(lead.phone).toBeUndefined()
    expect(
      mapLead('proposta', { ...propostaData, telefone: 'não é telefone' }, SDR).lead.phone,
    ).toBeUndefined()
  })

  it('mapeia a cidade do form para o nome da região (industry, string)', () => {
    expect(mapLead('proposta', propostaData, SDR).lead.industry).toBe('João Pessoa')
    expect(
      mapLead('proposta', { ...propostaData, cidade: 'Recife e região' }, SDR).lead.industry,
    ).toBe('Recife')
    expect(
      mapLead('proposta', { ...propostaData, cidade: 'Belém e região' }, SDR).lead.industry,
    ).toBe('Belém')
  })

  it('"Outra cidade" não define industry', () => {
    const { lead } = mapLead('proposta', { ...propostaData, cidade: 'Outra cidade' }, SDR)
    expect(lead.industry).toBeUndefined()
  })

  it('lead com gclid entra como origem Anúncio', () => {
    const comGclid = { ...propostaData, 'origem — gclid (Google Ads)': 'Cj0KCQ-fake' }
    expect(mapLead('proposta', comGclid, SDR).lead.source).toBe('Anúncio')
  })

  it('lead sem sinal de mídia paga entra como origem Site', () => {
    expect(mapLead('proposta', propostaData, SDR).lead.source).toBe('Site')
  })

  it('canal classificado como tráfego pago também entra como Anúncio', () => {
    const pago = { ...propostaData, 'origem — Canal (origem)': 'Microsoft Ads (tráfego pago)' }
    expect(mapLead('proposta', pago, SDR).lead.source).toBe('Anúncio')
  })

  it('nunca manda subSource (mandar valor novo cria sub-origem no tenant)', () => {
    expect('subSource' in mapLead('proposta', propostaData, SDR).lead).toBe(false)
  })

  it('página de entrada vira mktLink', () => {
    const comLanding = {
      ...propostaData,
      'origem — Página de entrada':
        'https://semog.com.br/administradora-de-condominios-joao-pessoa',
    }
    expect(mapLead('proposta', comLanding, SDR).lead.mktLink).toBe(
      'https://semog.com.br/administradora-de-condominios-joao-pessoa',
    )
  })

  it('página de entrada em caminho relativo vira URL absoluta (clicável no CRM)', () => {
    // A atribuição guarda caminho, não URL — visto nos 2 primeiros leads reais.
    const raiz = { ...propostaData, 'origem — Página de entrada': '/' }
    expect(mapLead('proposta', raiz, SDR).lead.mktLink).toBe('https://www.semog.com.br/')

    const landing = {
      ...propostaData,
      'origem — Página de entrada': '/administradora-de-condominios-belem',
    }
    expect(mapLead('proposta', landing, SDR).lead.mktLink).toBe(
      'https://www.semog.com.br/administradora-de-condominios-belem',
    )
  })

  it('sem página de entrada não inventa mktLink', () => {
    expect(mapLead('proposta', propostaData, SDR).lead.mktLink).toBeUndefined()
  })

  it('funil e SDR são fixos', () => {
    const { lead } = mapLead('proposta', propostaData, SDR)
    expect(lead.funnelId).toBe(24653)
    expect(lead.sdrEmail).toBe(SDR)
  })
})

describe('mapLead — descrição', () => {
  it('carrega mensagem, valores crus do site e origem', () => {
    const comOrigem = {
      ...propostaData,
      'origem — Canal (origem)': 'Busca orgânica (google)',
      'origem — Página de entrada': 'https://semog.com.br/proposta',
    }
    const { lead } = mapLead('proposta', comOrigem, SDR)

    expect(lead.description).toContain('Queremos uma proposta.')
    expect(lead.description).toContain('Síndico(a)')
    expect(lead.description).toContain('Condomínio residencial')
    expect(lead.description).toContain('84')
    expect(lead.description).toContain('maria@example.com')
    expect(lead.description).toContain('Busca orgânica (google)')
    expect(lead.description).toContain('semog.com.br/proposta')
  })

  it('os campos que não cabem em campo próprio do Exact estão todos na descrição', () => {
    // Unidades/papel/tipo não têm onde ir: a v3 não grava campo personalizado.
    const { lead } = mapLead('proposta', propostaData, SDR)
    expect(lead.description).toMatch(/papel: Síndico\(a\)/)
    expect(lead.description).toMatch(/tipo: Condomínio residencial/)
    expect(lead.description).toMatch(/unidades: 84/)
  })

  it('form de contato leva o assunto na descrição', () => {
    const { lead } = mapLead(
      'contato',
      {
        nome: 'João',
        email: 'j@x.com',
        telefone: '+5581999998888',
        assunto: 'proposta-comercial',
        mensagem: 'Quero proposta para 3 prédios.',
      },
      SDR,
    )
    expect(lead.name).toBe('João')
    expect(lead.description).toContain('proposta-comercial')
    expect(lead.description).toContain('3 prédios')
  })

  it('diz de qual formulário o lead veio', () => {
    // Muda o que esperar do lead: "proposta" traz os campos do condomínio;
    // "contato" costuma vir com menos dado e mais texto livre.
    expect(mapLead('proposta', propostaData, SDR).lead.description).toContain(
      'formulário de proposta',
    )
    expect(
      mapLead('contato', { nome: 'João', assunto: 'proposta-comercial' }, SDR).lead.description,
    ).toContain('formulário de contato')
  })

  it('lead sem mensagem nem origem ainda tem descrição válida', () => {
    const { lead } = mapLead('proposta', { nome: 'Zé', email: 'z@x.com' }, SDR)
    expect(typeof lead.description).toBe('string')
    expect(lead.description).toContain('z@x.com')
  })
})

describe('mapLead — contato principal', () => {
  it('monta a pessoa com cargo cru e telefone quebrado', () => {
    const { person } = mapLead('proposta', propostaData, SDR)
    expect(person).toEqual({
      name: 'Maria Souza',
      email: 'maria@example.com',
      jobTitle: 'Síndico(a)',
      ddiPhone1: '55',
      phone1: '83999501388',
      mainContact: true,
    })
  })
})
