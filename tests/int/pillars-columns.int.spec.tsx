import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PillarsBlock } from '@/blocks/Pillars/Component'

const items = [
  { title: 'Condomínios', text: 'Gestão completa de comunidades.' },
  { title: 'Métricas', text: 'Decisões guiadas por dados.' },
  { title: 'Organização', text: 'Processos claros e prazos cumpridos.' },
]

describe('PillarsBlock — variante columns', () => {
  it('renderiza os itens em colunas', () => {
    const { container } = render(
      <PillarsBlock blockType="pillars" variant="columns" items={items} />,
    )
    expect(container.querySelector('.pillars-columns')).not.toBeNull()
    expect(screen.getByText('Condomínios')).toBeDefined()
    expect(screen.getByText('Organização')).toBeDefined()
  })

  it('não usa .pillar-row na variante columns', () => {
    const { container } = render(
      <PillarsBlock blockType="pillars" variant="columns" items={items} />,
    )
    expect(container.querySelector('.pillar-row')).toBeNull()
  })

  it('sem variant, mantém as rows de sempre', () => {
    const { container } = render(<PillarsBlock blockType="pillars" items={items} />)
    expect(container.querySelectorAll('.pillar-row').length).toBe(3)
    expect(container.querySelector('.pillars-columns')).toBeNull()
  })

  it('funciona com 2 itens (página do aplicativo)', () => {
    render(
      <PillarsBlock
        blockType="pillars"
        variant="columns"
        items={[items[0], items[1]]}
      />,
    )
    expect(screen.getByText('Condomínios')).toBeDefined()
    expect(screen.getByText('Métricas')).toBeDefined()
  })
})
