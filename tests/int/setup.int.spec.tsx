import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Section } from '@/components/ui/Section'

describe('ambiente de teste', () => {
  it('coleta arquivos .tsx e renderiza componentes do projeto', () => {
    render(<Section>conteúdo</Section>)
    expect(screen.getByText('conteúdo')).toBeDefined()
  })

  it('tem matchMedia disponível para o gsap', () => {
    expect(typeof window.matchMedia).toBe('function')
    expect(window.matchMedia('(max-width: 768px)').matches).toBe(false)
  })
})
