import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { corpoDoIngest, lerConfigAds, tipoDeClique } = await import('@/lib/ads/conversoes')

const CONFIG = {
  login: '1112223333',
  customer: '4445556666',
  acaoProposta: '999',
  subject: 'sa@semog.com.br',
  saJson: '{}',
}

describe('Data Manager API (D1, R9)', () => {
  it('tipo de clique desconhecido ou ausente vai como gclid (formato de hoje)', () => {
    expect(tipoDeClique(undefined)).toBe('gclid')
    expect(tipoDeClique(null)).toBe('gclid')
    expect(tipoDeClique('qualquer')).toBe('gclid')
    expect(tipoDeClique('gbraid')).toBe('gbraid')
    expect(tipoDeClique('wbraid')).toBe('wbraid')
  })

  it('cada clique vai no campo próprio de AdIdentifiers, com transactionId e consentimento', () => {
    const corpo = corpoDoIngest(CONFIG, '999', [
      {
        transactionId: 'lead-1',
        tipoDeClique: 'gclid',
        clique: 'C',
        criadoEm: '2026-10-16T12:00:00.000Z',
        adsConsent: 'granted',
      },
      {
        transactionId: 'lead-2',
        tipoDeClique: 'gbraid',
        clique: 'G',
        criadoEm: new Date('2026-10-16T13:00:00Z'),
        adsConsent: 'denied',
      },
    ])
    expect(corpo.destinations[0]?.productDestinationId).toBe('999')
    expect(corpo.events[0]).toMatchObject({
      adIdentifiers: { gclid: 'C' },
      transactionId: 'lead-1',
      conversionValue: 1,
      currency: 'BRL',
      eventSource: 'WEB',
      eventTimestamp: '2026-10-16T12:00:00.000Z',
      consent: { adUserData: 'CONSENT_GRANTED', adPersonalization: 'CONSENT_GRANTED' },
    })
    expect(corpo.events[1]?.adIdentifiers).toEqual({ gbraid: 'G' })
    expect(corpo.events[1]?.consent.adUserData).toBe('CONSENT_DENIED')
  })

  it('config incompleta é null; a ação do WhatsApp é opcional', () => {
    const env = {
      GOOGLE_ADS_LOGIN_CUSTOMER_ID: '1',
      GOOGLE_ADS_CUSTOMER_ID: '2',
      GOOGLE_ADS_CONVERSION_ACTION_ID: '3',
      GOOGLE_ADS_IMPERSONATED_EMAIL: 'a@b',
      GOOGLE_SA_JSON: '{}',
    }
    expect(lerConfigAds(env)).toMatchObject({ acaoProposta: '3', acaoWhatsapp: undefined })
    expect(lerConfigAds({ ...env, GOOGLE_SA_JSON: '' })).toBeNull()
  })
})
