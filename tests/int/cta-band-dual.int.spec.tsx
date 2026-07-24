import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CTABandBlock } from '@/blocks/CTABand/Component'

const paths = [
  {
    title: 'Sou síndico ou conselheiro',
    text: 'Quero o aplicativo no meu condomínio.',
    cta: { label: 'Solicitar proposta', href: '/proposta' },
  },
  {
    title: 'Moro em um condomínio Semog',
    text: 'Quero baixar o aplicativo.',
    cta: { label: 'Baixar o aplicativo', href: '#baixar' },
  },
]

describe('CTABandBlock — variante dual', () => {
  it('renderiza os dois caminhos com título, texto e CTA', () => {
    const { container } = render(
      <CTABandBlock
        blockType="ctaBand"
        variant="dual"
        title="Cada um segue por um caminho."
        cta={{ label: 'Solicitar proposta', href: '/proposta' }}
        paths={paths}
      />,
    )
    expect(screen.getByText('Sou síndico ou conselheiro')).toBeDefined()
    expect(screen.getByText('Moro em um condomínio Semog')).toBeDefined()
    expect(screen.getByRole('link', { name: /baixar o aplicativo/i })).toBeDefined()
    expect(container.querySelectorAll('.final-cta-path')).toHaveLength(2)
  })

  it('cai para centered quando paths está vazio', () => {
    const { container } = render(
      <CTABandBlock
        blockType="ctaBand"
        variant="dual"
        title="Sem caminhos"
        cta={{ label: 'Solicitar proposta', href: '/proposta' }}
      />,
    )
    expect(container.querySelector('.final-cta-dual')).toBeNull()
    expect(container.querySelector('.final-cta')).not.toBeNull()
    expect(screen.getByRole('link', { name: /solicitar proposta/i })).toBeDefined()
  })

  it('a variante centered continua igual (sem paths, sem regressão)', () => {
    render(
      <CTABandBlock
        blockType="ctaBand"
        variant="centered"
        title="Seu condomínio merece governança de líder."
        cta={{ label: 'Solicitar proposta', href: '/proposta' }}
      />,
    )
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('a variante band continua igual (sem paths, sem regressão)', () => {
    const { container } = render(
      <CTABandBlock
        blockType="ctaBand"
        title="Seu condomínio merece governança de líder."
        cta={{ label: 'Solicitar proposta', href: '/proposta' }}
      />,
    )
    expect(container.querySelector('.final-cta-dual')).toBeNull()
    expect(container.querySelector('.final-cta')).toBeNull()
  })
})
