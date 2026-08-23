import { describe, expect, it } from 'vitest'
import { pages } from '@/../content/pages'
import sitemap from '@/app/(frontend)/sitemap'
import { CITY_LANDINGS } from '@/data/cityLandings'
import { getAllPosts } from '@/lib/blog'
import { absoluteUrl } from '@/lib/seo'

/**
 * O sitemap varria só `content/pages` + blog, e as landings de cidade são
 * data-driven (`src/data/cityLandings.ts`, rota explícita própria) — então
 * ficaram de fora desde que subiram, enquanto as URLs antigas
 * `/locais/semog-administradora-de-condominios-*` seguiam indexadas. Estes
 * testes travam a regra: **toda página de captação tem que estar no sitemap**.
 */
describe('sitemap.xml', () => {
  it('inclui as 4 landings de cidade (páginas de captação)', async () => {
    const entries = await sitemap()
    const urls = entries.map((e) => e.url)

    const cities = Object.values(CITY_LANDINGS)
    expect(cities).toHaveLength(4)
    for (const city of cities) {
      expect(urls).toContain(absoluteUrl(city.slug))
    }
  })

  it('não perde as páginas estáticas nem os posts ao somar as cidades', async () => {
    const entries = await sitemap()
    const urls = new Set(entries.map((e) => e.url))

    for (const slug of Object.keys(pages)) {
      expect(urls.has(absoluteUrl(slug))).toBe(true)
    }
    for (const post of getAllPosts()) {
      expect(urls.has(absoluteUrl(`blog/${post.slug}`))).toBe(true)
    }
  })

  it('não tem URL duplicada', async () => {
    const entries = await sitemap()
    const urls = entries.map((e) => e.url)
    expect(new Set(urls).size).toBe(urls.length)
  })

  /**
   * A landing do Semog Experience vive num route group irmão (`(evento)`), com
   * rota explícita própria e fora de `content/pages` — exatamente a mesma
   * forma das landings de cidade, que foi como elas escaparam do sitemap. É
   * página de captação (tem formulário), então entra na regra acima.
   */
  it('inclui a landing do Experience', async () => {
    const entries = await sitemap()
    expect(entries.map((e) => e.url)).toContain(absoluteUrl('experience'))
  })

  it('nunca lista as URLs legadas /locais/ (elas só redirecionam)', async () => {
    const entries = await sitemap()
    expect(entries.every((e) => !e.url.includes('/locais/'))).toBe(true)
  })
})
