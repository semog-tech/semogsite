import { describe, expect, it } from 'vitest'
import { buildAttributionFields, cliqueDoGoogle } from '@/lib/attribution'

describe('clique do Google do lead (R9)', () => {
  it('usa o do primeiro toque quando existe', () => {
    expect(cliqueDoGoogle({ first: { gclid: 'A' }, last: { gclid: 'B' } })).toEqual({
      tipo: 'gclid',
      valor: 'A',
    })
  })

  it('sem clique no primeiro toque, usa o do último (como o beacon do WhatsApp)', () => {
    expect(
      cliqueDoGoogle({ first: { source: 'google', medium: 'organic' }, last: { gclid: 'B' } }),
    ).toEqual({
      tipo: 'gclid',
      valor: 'B',
    })
  })

  it('gbraid e wbraid saem com o tipo próprio', () => {
    expect(cliqueDoGoogle({ first: { gbraid: 'G' }, last: {} })).toEqual({
      tipo: 'gbraid',
      valor: 'G',
    })
    expect(cliqueDoGoogle({ first: {}, last: { wbraid: 'W' } })).toEqual({
      tipo: 'wbraid',
      valor: 'W',
    })
  })

  it('sem atribuição, nenhum clique', () => {
    expect(cliqueDoGoogle(null)).toBeNull()
    expect(cliqueDoGoogle({ first: {}, last: {} })).toBeNull()
  })

  it('a atribuição grava o clique do último toque e o tipo quando não é gclid', () => {
    const campos = buildAttributionFields({ first: { landing: '/' }, last: { wbraid: 'W' } })
    expect(campos).toContainEqual({ label: 'gclid (Google Ads)', value: 'W' })
    expect(campos).toContainEqual({ label: 'Tipo do clique (Google Ads)', value: 'wbraid' })
  })

  it('gclid comum não ganha a linha de tipo', () => {
    const campos = buildAttributionFields({ first: { gclid: 'A' }, last: {} })
    expect(campos.map((c) => c.label)).not.toContain('Tipo do clique (Google Ads)')
  })
})
