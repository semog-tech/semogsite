import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppShowcaseBlock } from '@/blocks/AppShowcase/Component'

const base = {
  blockType: 'appShowcase' as const,
  title: 'O condomínio inteiro na palma da mão.',
}

describe('AppShowcaseBlock', () => {
  it('renderiza a nota e o rótulo quando preenchidos', () => {
    render(
      <AppShowcaseBlock
        {...base}
        rating={{ score: '4,8', label: '1.133 avaliações na App Store e no Google Play' }}
      />,
    )
    expect(screen.getByText('4,8')).toBeDefined()
    expect(screen.getByText(/1\.133 avaliações/)).toBeDefined()
  })

  it('renderiza os selos como links reais para as lojas', () => {
    render(
      <AppShowcaseBlock
        {...base}
        stores={{
          appStore: 'https://apps.apple.com/br/app/id6504202916',
          playStore: 'https://play.google.com/store/apps/details?id=br.com.semog',
        }}
      />,
    )
    const apple = screen.getByRole('link', { name: /app store/i })
    const play = screen.getByRole('link', { name: /google play/i })
    expect(apple.getAttribute('href')).toContain('apps.apple.com')
    expect(play.getAttribute('href')).toContain('play.google.com')
  })

  it('omite selo de loja sem URL', () => {
    render(<AppShowcaseBlock {...base} stores={{ appStore: 'https://apps.apple.com/x' }} />)
    expect(screen.getByRole('link', { name: /app store/i })).toBeDefined()
    expect(screen.queryByRole('link', { name: /google play/i })).toBeNull()
  })

  it('não renderiza nota nem selos quando os campos estão vazios', () => {
    const { container } = render(<AppShowcaseBlock {...base} />)
    expect(container.querySelector('.app-rating')).toBeNull()
    expect(container.querySelector('.store-badges')).toBeNull()
  })

  it('aplica o tema escuro quando theme=deep', () => {
    const { container } = render(<AppShowcaseBlock {...base} theme="deep" />)
    const section = container.querySelector('section')
    expect(section?.className).not.toContain('sec-light')
  })

  it('mantém sec-light por padrão (comportamento de /solucoes)', () => {
    const { container } = render(<AppShowcaseBlock {...base} />)
    expect(container.querySelector('section')?.className).toContain('sec-light')
  })
})
