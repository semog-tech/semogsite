import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CTABandBlock } from '@/blocks/CTABand/Component'

const base = {
  blockType: 'ctaBand' as const,
  title: 'Seu condomínio merece governança de líder.',
  cta: { label: 'Solicitar proposta', href: '/proposta' },
}

describe('CTABandBlock — segundo caminho', () => {
  it('renderiza o CTA secundário quando preenchido', () => {
    render(
      <CTABandBlock
        {...base}
        variant="centered"
        secondaryCta={{ label: 'Falar no WhatsApp', href: 'https://wa.me/5581999999999' }}
      />,
    )
    expect(screen.getByRole('link', { name: /solicitar proposta/i })).toBeDefined()
    const wpp = screen.getByRole('link', { name: /falar no whatsapp/i })
    expect(wpp.getAttribute('href')).toContain('wa.me')
  })

  it('não renderiza nada de secundário quando o campo está vazio', () => {
    render(<CTABandBlock {...base} variant="centered" />)
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('ignora CTA secundário sem href', () => {
    render(<CTABandBlock {...base} variant="centered" secondaryCta={{ label: 'Sem link' }} />)
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('a variante band segue com um botão só', () => {
    render(
      <CTABandBlock
        {...base}
        secondaryCta={{ label: 'Falar no WhatsApp', href: 'https://wa.me/x' }}
      />,
    )
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })
})
