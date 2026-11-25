import { describe, expect, it } from 'vitest'
import { CITY_LANDINGS, wholeState } from '@/data/cityLandings'

/**
 * "Atendemos todo o Pernambuco" saiu em produção na landing de Recife: o
 * quantificador vinha só do gênero, e Pernambuco não leva artigo. Este teste
 * trava a frase das quatro praças.
 */
describe('wholeState', () => {
  it('concorda gênero e artigo do estado de cada praça', () => {
    expect(wholeState(CITY_LANDINGS.recife)).toBe('todo Pernambuco')
    expect(wholeState(CITY_LANDINGS['joao-pessoa'])).toBe('toda a Paraíba')
    expect(wholeState(CITY_LANDINGS['campina-grande'])).toBe('toda a Paraíba')
    expect(wholeState(CITY_LANDINGS.belem)).toBe('todo o Pará')
  })
})
