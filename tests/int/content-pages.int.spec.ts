import { describe, expect, it } from 'vitest'
import { pages } from '@/../content/pages'

const ESPERADAS = [
  'home',
  'semog',
  'solucoes',
  'administracao-de-condominios',
  'garante',
  'incorporadoras',
  'blog',
  'contato',
  'proposta',
  'privacidade',
  'termos',
]

describe('content/pages', () => {
  it('tem todas as páginas do catch-all', () => {
    for (const slug of ESPERADAS) expect(pages[slug], slug).toBeDefined()
  })

  it('cada página tem slug batendo com a chave e um layout array', () => {
    for (const [slug, page] of Object.entries(pages)) {
      expect(page.slug).toBe(slug)
      expect(Array.isArray(page.layout)).toBe(true)
    }
  })

  it('a home começa com um hero e tem a faixa de prova', () => {
    const home = pages.home
    expect(home.layout[0].blockType).toBe('hero')
    const hero = home.layout[0] as { proofItems?: unknown[] }
    expect(hero.proofItems?.length).toBeGreaterThan(0)
  })
})
