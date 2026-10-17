import { describe, expect, it } from 'vitest'
import { conteudo } from '@/site/conteudo/conteudo'
import { estaPendente, pendenciasDe, pendente } from '@/site/conteudo/pendencias'
import { VIRADA_1_FEITA } from '@/site/inventario'

describe('pendências de conteúdo (dado que depende do Leandro)', () => {
  it('estaPendente só reconhece o objeto criado por pendente', () => {
    expect(estaPendente(pendente('x'))).toBe(true)
    expect(estaPendente({ pendente: 'x', outra: 1 })).toBe(false)
    expect(estaPendente({ pendente: 3 })).toBe(false)
    expect(estaPendente('A CONFIRMAR')).toBe(false)
    expect(estaPendente(null)).toBe(false)
  })

  it('pendenciasDe acha a pendência em qualquer profundidade e diz onde', () => {
    expect(pendenciasDe({ a: [{ b: pendente('foto') }], c: 'texto' })).toEqual(['a.0.b: foto'])
  })

  it('as pendências de hoje são exatamente as conhecidas (pendência nova é decisão escrita)', () => {
    expect(pendenciasDe(conteudo).map((p) => p.split(':')[0])).toEqual([
      'tecnologia.numerosDaPrestacao',
      'aSemog.pessoas.fotoDosSocios',
    ])
  })

  it('a virada 1 não acontece com pendência de conteúdo: nenhum dado provisório vai ao ar', () => {
    // Antes da virada, a pendência aparece só na prévia, com o selo A CONFIRMAR. No commit da
    // virada (VIRADA_1_FEITA = true), este teste derruba a CI se alguma sobrou.
    expect(VIRADA_1_FEITA ? pendenciasDe(conteudo) : []).toEqual([])
  })
})
