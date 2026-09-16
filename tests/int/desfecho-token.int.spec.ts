import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Token que autoriza registrar o desfecho de um lead (`@/lib/desfechoToken`).
 *
 * É a única coisa entre um endereço público e os dados de um lead: sem ele, a
 * página `/desfecho/<id>` mostraria nome, e-mail e telefone para quem chutasse
 * um id de 1 a 40. O que estes testes defendem é exatamente isso — que um
 * token só vale para o lead que ele assina, e que sem segredo configurado nada
 * é assinado (em vez de cair num segredo padrão).
 *
 * `server-only` lança no jsdom do Vitest — mesma neutralização já usada em
 * `ads-consent`/`submit-form`.
 */
vi.mock('server-only', () => ({}))

const { assinarLead, botoesDeDesfecho, tokenConfere } = await import('@/lib/desfechoToken')

const SEGREDO_ORIGINAL = process.env.LEAD_OUTCOME_SECRET
const SITE_URL_ORIGINAL = process.env.NEXT_PUBLIC_SITE_URL

beforeEach(() => {
  process.env.LEAD_OUTCOME_SECRET = 'segredo-de-teste-nao-usado-em-producao'
  process.env.NEXT_PUBLIC_SITE_URL = 'https://www.semog.com.br'
})

afterEach(() => {
  if (SEGREDO_ORIGINAL === undefined) delete process.env.LEAD_OUTCOME_SECRET
  else process.env.LEAD_OUTCOME_SECRET = SEGREDO_ORIGINAL
  if (SITE_URL_ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_SITE_URL
  else process.env.NEXT_PUBLIC_SITE_URL = SITE_URL_ORIGINAL
})

describe('assinarLead / tokenConfere', () => {
  it('o token do próprio lead confere', () => {
    const token = assinarLead('42')
    expect(token).toBeTruthy()
    expect(tokenConfere('42', token as string)).toBe(true)
  })

  it('token de OUTRO lead não confere — é a regra que impede varrer a base', () => {
    const tokenDo42 = assinarLead('42') as string
    const tokenDo43 = assinarLead('43') as string

    expect(tokenDo42).not.toBe(tokenDo43)
    expect(tokenConfere('43', tokenDo42)).toBe(false)
    expect(tokenConfere('42', tokenDo43)).toBe(false)
  })

  it('token adulterado num caractere não confere', () => {
    const token = assinarLead('42') as string
    const primeiro = token[0] === 'A' ? 'B' : 'A'
    expect(tokenConfere('42', primeiro + token.slice(1))).toBe(false)
  })

  // Os três casos abaixo estavam num `it` só. Ficam separados de propósito:
  // cada um é uma porta diferente, e um mutante que abra apenas UMA precisa
  // aparecer com nome próprio na saída do CI — não diluído num teste genérico.

  it('token ausente não confere', () => {
    expect(tokenConfere('42', undefined)).toBe(false)
  })

  it('token vazio não confere', () => {
    expect(tokenConfere('42', '')).toBe(false)
  })

  it('token de tamanho diferente não confere — e não lança', () => {
    // `timingSafeEqual` LANÇA com buffers de tamanhos diferentes. A asserção
    // aqui é dupla: rejeita, e rejeita sem explodir — ou seja, a comparação de
    // tamanho acontece ANTES dela. Um `throw` aqui viraria erro 500 na página,
    // que é informação a mais para quem estiver sondando.
    expect(tokenConfere('42', 'curto')).toBe(false)
    expect(tokenConfere('42', `${assinarLead('42')}a`)).toBe(false)
  })

  it('id que não é número não é assinado nem aceito', () => {
    expect(assinarLead('42; drop table cms.leads')).toBeNull()
    expect(assinarLead('')).toBeNull()
    expect(tokenConfere('abc', 'qualquer-coisa')).toBe(false)
  })

  it('sem LEAD_OUTCOME_SECRET nada é assinado — e nada é aceito', () => {
    const token = assinarLead('42') as string
    delete process.env.LEAD_OUTCOME_SECRET

    expect(assinarLead('42')).toBeNull()
    // Sem segredo, nem o token que era válido passa: a falha é fechada, não
    // aberta com um segredo padrão.
    expect(tokenConfere('42', token)).toBe(false)
  })

  it('trocar o segredo invalida os tokens antigos', () => {
    const token = assinarLead('42') as string
    process.env.LEAD_OUTCOME_SECRET = 'outro-segredo'
    expect(tokenConfere('42', token)).toBe(false)
  })
})

describe('botoesDeDesfecho', () => {
  it('monta os quatro botões com URL absoluta, token e status', () => {
    const botoes = botoesDeDesfecho('42')
    expect(botoes).toHaveLength(4)

    const token = assinarLead('42') as string
    expect(botoes?.map((b) => b.status)).toEqual([
      'negociando',
      'fechou',
      'nao_evoluiu',
      'nao_e_lead',
    ])
    for (const botao of botoes ?? []) {
      expect(botao.url).toBe(
        `https://www.semog.com.br/desfecho/42?t=${encodeURIComponent(token)}&s=${botao.status}`,
      )
      expect(botao.rotulo).toBeTruthy()
    }
  })

  it('os quatro botões usam o MESMO token — o link vale pro lead, não pro status', () => {
    const tokens = new Set(
      (botoesDeDesfecho('42') ?? []).map((b) => new URL(b.url).searchParams.get('t')),
    )
    expect(tokens.size).toBe(1)
  })

  it('sem segredo, não há botões (e o e-mail sai sem a seção)', () => {
    delete process.env.LEAD_OUTCOME_SECRET
    expect(botoesDeDesfecho('42')).toBeNull()
  })
})
