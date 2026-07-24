import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppHeroBlock } from '@/blocks/AppHero/Component'

const base = {
  blockType: 'appHero' as const,
  headline: 'O condomínio inteiro na palma da mão.',
}

describe('AppHeroBlock', () => {
  it('renderiza a headline como h1', () => {
    render(<AppHeroBlock {...base} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('palma da mão')
  })

  it('mostra a nota e os selos das lojas', () => {
    render(
      <AppHeroBlock
        {...base}
        rating={{ score: '4,8', label: '1.133 avaliações · 10 mil+ downloads no Android' }}
        stores={{
          appStore: 'https://apps.apple.com/br/app/id6504202916',
          playStore: 'https://play.google.com/store/apps/details?id=br.com.semog',
        }}
      />,
    )
    expect(screen.getByText('4,8')).toBeDefined()
    expect(screen.getByRole('link', { name: /app store/i })).toBeDefined()
    expect(screen.getByRole('link', { name: /google play/i })).toBeDefined()
  })

  it('renderiza a nota de rodapé quando preenchida', () => {
    render(<AppHeroBlock {...base} footnote="Grátis para o morador." />)
    expect(screen.getByText('Grátis para o morador.')).toBeDefined()
  })

  it('renderiza as duas telas sobrepostas quando há dois screens', () => {
    const { container } = render(
      <AppHeroBlock
        {...base}
        screens={[
          { image: { url: '/phone-1.png', alt: 'Tela inicial' } },
          { image: { url: '/phone-3.png', alt: 'Tela de reserva' } },
        ]}
      />,
    )
    expect(container.querySelector('.app-screens')).not.toBeNull()
    expect(container.querySelectorAll('.app-screen')).toHaveLength(2)
  })

  it('funciona sem nota, selos, lead nem telas', () => {
    const { container } = render(<AppHeroBlock {...base} />)
    expect(container.querySelector('.app-rating')).toBeNull()
    expect(container.querySelector('.store-badges')).toBeNull()
    expect(container.querySelector('.app-screens')).toBeNull()
  })
})
