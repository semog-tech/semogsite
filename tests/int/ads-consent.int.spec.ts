import { describe, expect, it, vi } from 'vitest'

/**
 * Consentimento de publicidade decidido no servidor (`@/lib/adsConsent`) — o
 * valor que sobe junto com a conversão no Google Ads, no lugar do
 * `CONSENT_GRANTED` que ficava fixo no código do cron.
 *
 * Duas coisas precisam continuar verdadeiras aqui, porque errar qualquer uma
 * delas é afirmar ao Google um consentimento que não existe:
 *
 * 1. a precedência é a mesma do Consent Mode — escolha explícita vence região;
 * 2. sem valor gravado, o cron manda "não sabemos", nunca "concedido".
 */

// `@/lib/adsConsent` importa `server-only`, que lança no jsdom do vitest —
// mesma neutralização já usada em `exact-push-lead`/`experience-exact-guard`.
vi.mock('server-only', () => ({}))

const { consentimentoDeAnuncio, paisDaRequisicao, paraDataManager } = await import(
  '@/lib/adsConsent'
)

/** Cookie `semog-consent` como ele é gravado pelo navegador (JSON). */
function cookie(marketing: boolean): string {
  return JSON.stringify({ necessary: true, analytics: true, marketing })
}

describe('consentimentoDeAnuncio — sem escolha explícita, decide pela região', () => {
  it('nega nos territórios que exigem consentimento afirmativo', () => {
    for (const pais of ['DE', 'FR', 'PT', 'IE', 'NO', 'IS', 'LI', 'GB', 'CH']) {
      expect(consentimentoDeAnuncio(undefined, pais)).toBe('denied')
    }
  })

  it('concede no Brasil e no resto do mundo', () => {
    for (const pais of ['BR', 'US', 'AR', 'PT-BR-invalido', 'JP']) {
      expect(consentimentoDeAnuncio(undefined, pais)).toBe('granted')
    }
  })

  it('concede quando não há país — caso explícito, não resto de expressão', () => {
    expect(consentimentoDeAnuncio(undefined, null)).toBe('granted')
    expect(consentimentoDeAnuncio(undefined, undefined)).toBe('granted')
    expect(consentimentoDeAnuncio(undefined, '')).toBe('granted')
    expect(consentimentoDeAnuncio(undefined, '   ')).toBe('granted')
  })

  it('aceita o código em qualquer caixa e com espaço em volta', () => {
    expect(consentimentoDeAnuncio(undefined, 'de')).toBe('denied')
    expect(consentimentoDeAnuncio(undefined, ' Fr ')).toBe('denied')
  })
})

describe('consentimentoDeAnuncio — escolha explícita vence a região', () => {
  it('opt-out no Brasil nega', () => {
    expect(consentimentoDeAnuncio(cookie(false), 'BR')).toBe('denied')
  })

  it('opt-in na Europa concede — quem ligou na mão consentiu de verdade', () => {
    expect(consentimentoDeAnuncio(cookie(true), 'DE')).toBe('granted')
  })

  it('cookie ilegível não conta como escolha: cai na região', () => {
    expect(consentimentoDeAnuncio('{lixo', 'DE')).toBe('denied')
    expect(consentimentoDeAnuncio('{lixo', 'BR')).toBe('granted')
    // Um JSON válido mas sem o shape de consentimento também não conta.
    expect(consentimentoDeAnuncio('{"marketing":"talvez"}', 'DE')).toBe('denied')
  })
})

describe('paraDataManager — o que vai no evento', () => {
  it('traduz os valores gravados', () => {
    expect(paraDataManager('granted')).toBe('CONSENT_GRANTED')
    expect(paraDataManager('denied')).toBe('CONSENT_DENIED')
  })

  it('linha legada (null) vai como concedida — decisão temporária de 11/09/2026', () => {
    // Coletadas sob o regime antigo, com o banner no ar: parte aceitou de
    // fato, e o resto é tráfego brasileiro, que o desenho novo concede por
    // padrão. Some sozinho três dias depois do deploy (WINDOW_DAYS).
    expect(paraDataManager(null)).toBe('CONSENT_GRANTED')
  })

  it('valor inesperado é defeito, não linha legada: vai como UNSPECIFIED', () => {
    expect(paraDataManager('')).toBe('CONSENT_STATUS_UNSPECIFIED')
    expect(paraDataManager('qualquer-outra-coisa')).toBe('CONSENT_STATUS_UNSPECIFIED')
    expect(paraDataManager('GRANTED')).toBe('CONSENT_STATUS_UNSPECIFIED')
  })
})

describe('paisDaRequisicao', () => {
  it('lê o header da Vercel', () => {
    expect(paisDaRequisicao(new Headers({ 'x-vercel-ip-country': 'DE' }))).toBe('DE')
  })

  it('devolve null fora da Vercel', () => {
    expect(paisDaRequisicao(new Headers())).toBeNull()
  })
})
