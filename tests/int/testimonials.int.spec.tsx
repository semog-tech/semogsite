import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TestimonialsBlock } from '@/blocks/Testimonials/Component'

const item = {
  quote: 'Trocamos e a inadimplência caiu.',
  author: 'Maria Souza',
  role: 'Síndica',
  org: 'Condomínio Vista Mar',
  city: 'Recife',
}

describe('TestimonialsBlock', () => {
  it('mostra autor, papel, organização e cidade', () => {
    render(<TestimonialsBlock blockType="testimonials" items={[item]} />)
    expect(screen.getByText('Maria Souza')).toBeDefined()
    expect(screen.getByText(/Síndica/)).toBeDefined()
    expect(screen.getByText(/Condomínio Vista Mar/)).toBeDefined()
    expect(screen.getByText(/Recife/)).toBeDefined()
  })

  it('usa a inicial do autor como avatar quando não há foto', () => {
    const { container } = render(<TestimonialsBlock blockType="testimonials" items={[item]} />)
    const avatar = container.querySelector('.depo-avatar')
    expect(avatar?.textContent).toBe('M')
  })

  it('renderiza as estrelas quando há rating', () => {
    const { container } = render(
      <TestimonialsBlock blockType="testimonials" items={[{ ...item, rating: 5 }]} />,
    )
    expect(container.querySelector('.depo-stars')).not.toBeNull()
  })

  it('não renderiza estrelas sem rating', () => {
    const { container } = render(<TestimonialsBlock blockType="testimonials" items={[item]} />)
    expect(container.querySelector('.depo-stars')).toBeNull()
  })

  it('renderiza a faixa de logos pelo nome quando não há imagem', () => {
    render(
      <TestimonialsBlock
        blockType="testimonials"
        items={[item]}
        logos={[{ name: 'Condomínio Alfa' }, { name: 'Incorporadora Beta' }]}
      />,
    )
    expect(screen.getByText('Condomínio Alfa')).toBeDefined()
    expect(screen.getByText('Incorporadora Beta')).toBeDefined()
  })

  it('sem logos, não renderiza a faixa', () => {
    const { container } = render(<TestimonialsBlock blockType="testimonials" items={[item]} />)
    expect(container.querySelector('.depo-logos')).toBeNull()
  })

  it('continua funcionando com só quote/author/role (landings de cidade)', () => {
    render(
      <TestimonialsBlock
        blockType="testimonials"
        items={[{ quote: 'Ótimo atendimento.', author: 'João', role: 'Morador' }]}
      />,
    )
    expect(screen.getByText('João')).toBeDefined()
  })
})
