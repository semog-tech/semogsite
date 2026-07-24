import { describe, expect, it } from 'vitest'
import type { Block, HeroBlock, StatsBlock } from '@/types/blocks'
import type { PageData } from '@/types/content'

describe('tipos de bloco', () => {
  it('HeroBlock cobre os campos do hero da home', () => {
    const b: HeroBlock = {
      blockType: 'hero',
      headline: 'x',
      proofItems: [{ value: '4,8', label: 'no app', stars: true }],
      ctas: [{ label: 'Solicitar', href: '/proposta', variant: 'white' }],
    }
    expect(b.blockType).toBe('hero')
  })

  it('StatsBlock aceita a variante band', () => {
    const b: StatsBlock = { blockType: 'stats', variant: 'band', items: [{ value: 35, label: 'Anos' }] }
    expect(b.variant).toBe('band')
  })

  it('a union Block aceita qualquer bloco', () => {
    const bs: Block[] = [{ blockType: 'hero', headline: 'x' }, { blockType: 'stats', items: [] }]
    expect(bs).toHaveLength(2)
  })

  it('PageData compõe slug, meta e layout', () => {
    const p: PageData = { slug: 'home', meta: { title: 't', description: 'd' }, layout: [] }
    expect(p.slug).toBe('home')
  })
})
