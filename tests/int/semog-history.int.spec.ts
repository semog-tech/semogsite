import { describe, expect, it } from 'vitest'
import { semog } from '@/../content/pages/semog'

describe('cronologia da expansão da Semog', () => {
  it('separa a chegada a João Pessoa, Belém e Campina Grande nos anos confirmados', () => {
    const timeline = semog.layout.find((block) => block.blockType === 'timeline')
    expect(timeline).toBeDefined()
    if (!timeline) throw new Error('A página institucional precisa da linha do tempo')

    const items = timeline.items ?? []
    const joaoPessoa = items.find((item) => item.text?.includes('João Pessoa'))
    const belem = items.find((item) => item.text?.includes('Belém'))
    const campinaGrande = items.find((item) =>
      `${item.title} ${item.text}`.includes('Campina Grande'),
    )

    expect(joaoPessoa?.date).toBe('2004')
    expect(joaoPessoa?.text).not.toContain('Campina Grande')
    expect(belem?.date).toBe('2019')
    expect(campinaGrande?.date).toBe('2025')
    expect(items.find((item) => item.title === 'Pioneirismo em IA')?.date).toBe('2019')

    const datedYears = items.filter((item) => !item.now).map((item) => Number(item.date))
    expect(datedYears).toEqual([...datedYears].sort((a, b) => a - b))
    const renderKeys = items.map((item) => item.id ?? item.date)
    expect(new Set(renderKeys).size).toBe(renderKeys.length)
  })
})
