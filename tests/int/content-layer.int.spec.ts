import { describe, expect, it } from 'vitest'
import { getPageBySlug, getSiteSettings } from '@/lib/content'

describe('camada de dados estática', () => {
  it('resolve a home pelo slug', async () => {
    const page = await getPageBySlug('home')
    expect(page?.slug).toBe('home')
    expect(page?.layout[0].blockType).toBe('hero')
  })

  it('devolve null para slug inexistente', async () => {
    expect(await getPageBySlug('nao-existe-123')).toBeNull()
  })

  it('getSiteSettings devolve título/descrição padrão', async () => {
    const s = await getSiteSettings()
    expect(s?.defaultTitle).toBeTruthy()
  })
})
