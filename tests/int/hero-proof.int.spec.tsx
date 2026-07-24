import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HeroBlock } from '@/blocks/Hero/Component'

const base = {
  blockType: 'hero' as const,
  headline: 'Preocupe-se apenas\nem morar.',
}

describe('HeroBlock — faixa de prova', () => {
  it('renderiza os itens de prova quando preenchidos', () => {
    render(
      <HeroBlock
        {...base}
        proofItems={[
          { value: '4,8', label: 'no app, 1.133 avaliações', stars: true },
          { value: '+650', label: 'condomínios sob gestão' },
        ]}
      />,
    )
    expect(screen.getByText('4,8')).toBeDefined()
    expect(screen.getByText('no app, 1.133 avaliações')).toBeDefined()
    expect(screen.getByText('+650')).toBeDefined()
  })

  it('não renderiza a faixa quando proofItems está vazio', () => {
    const { container } = render(<HeroBlock {...base} proofItems={[]} />)
    expect(container.querySelector('.hero-proof')).toBeNull()
  })

  it('esconde a tagbox quando há faixa de prova (as duas competem pelo mesmo canto)', () => {
    render(
      <HeroBlock
        {...base}
        tag="Condomínios. Métricas. Organização."
        proofItems={[{ value: '35 anos', label: 'desde 1991' }]}
      />,
    )
    expect(screen.queryByText('Condomínios. Métricas. Organização.')).toBeNull()
    expect(screen.getByText('35 anos')).toBeDefined()
  })

  it('mantém a tagbox quando não há faixa de prova', () => {
    render(<HeroBlock {...base} tag="Condomínios. Métricas. Organização." />)
    expect(screen.getByText('Condomínios. Métricas. Organização.')).toBeDefined()
  })
})
