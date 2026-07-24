import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HeroBlock } from '@/blocks/Hero/Component'
import { StatsBlock } from '@/blocks/Stats/Component'
import type { HeroBlock as HeroT, StatsBlock as StatsT } from '@/types/blocks'

describe('blocos renderizam com os tipos novos', () => {
  it('Hero', () => {
    const props: HeroT = { blockType: 'hero', headline: 'Preocupe-se apenas' }
    render(<HeroBlock {...props} />)
    // `Chars` quebra o headline em spans por caractere (ver `src/motion/Chars.tsx`),
    // então o texto some do `textContent` direto de qualquer nó — o próprio
    // componente expõe o texto completo via `aria-label`, usado aqui.
    expect(screen.getByRole('heading', { name: /Preocupe-se apenas/ })).toBeDefined()
  })

  it('Stats band', () => {
    const props: StatsT = {
      blockType: 'stats',
      variant: 'band',
      title: 'Liderança',
      items: [{ value: 35, label: 'Anos' }],
    }
    render(<StatsBlock {...props} />)
    expect(screen.getByText('Liderança')).toBeDefined()
  })
})
