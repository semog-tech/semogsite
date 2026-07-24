import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatsBlock } from '@/blocks/Stats/Component'

const items = [
  { value: 35, label: 'Anos de mercado', detail: 'Desde 1991, sempre no Nordeste.' },
  { value: 650, prefix: '+', label: 'Condomínios', detail: 'Sob gestão completa.' },
  { value: 70, prefix: '+', suffix: 'mil', label: 'Clientes', detail: 'Famílias e empresas.' },
  { value: 100, prefix: '+', label: 'Especialistas', detail: 'Time próprio.' },
  { value: 3, label: 'Estados', detail: 'Pernambuco, Paraíba e Pará.' },
]

describe('StatsBlock — variante band', () => {
  it('renderiza os 5 itens com rótulo e detalhe', () => {
    render(<StatsBlock blockType="stats" variant="band" title="Liderança" items={items} />)
    expect(screen.getByText('Anos de mercado')).toBeDefined()
    expect(screen.getByText('Desde 1991, sempre no Nordeste.')).toBeDefined()
    expect(screen.getByText('Estados')).toBeDefined()
  })

  it('não renderiza o mapa do Brasil', () => {
    const { container } = render(<StatsBlock blockType="stats" variant="band" items={items} />)
    expect(container.querySelector('svg[data-brazil-map]')).toBeNull()
  })

  it('a variante feature continua renderizando o mapa', () => {
    const { container } = render(<StatsBlock blockType="stats" variant="feature" items={items} />)
    expect(container.querySelector('svg[data-brazil-map]')).not.toBeNull()
  })

  it('sem itens, não renderiza nada', () => {
    const { container } = render(<StatsBlock blockType="stats" variant="band" items={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
