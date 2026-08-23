import type { MetadataRoute } from 'next'
import { pages } from '@/../content/pages'
import { CITY_LANDINGS } from '@/data/cityLandings'
import { getAllPosts } from '@/lib/blog'
import { absoluteUrl } from '@/lib/seo'

export const revalidate = 3600

/**
 * `/sitemap.xml` — páginas estáticas (`content/pages`) + landings de cidade
 * (`src/data/cityLandings.ts`) + a landing do Experience + posts
 * (`content/blog/*.mdx`, via `src/lib/blog.ts`). `lastModified` das páginas usa
 * a data do build (não há `updatedAt` no modelo estático); os posts usam a
 * própria `date` do frontmatter.
 *
 * As landings de cidade **não** moram em `content/pages` (são data-driven, com
 * rota explícita própria em `src/app/(frontend)/administradora-de-condominios-*`),
 * então precisam ser incluídas à parte — foi exatamente esse o furo: elas
 * ficaram fora do sitemap desde que subiram, enquanto as URLs antigas
 * `/locais/semog-administradora-de-condominios-*` seguiam indexadas com anos de
 * histórico. Resultado medido no Search Console em 29/07/2026: a URL VELHA
 * ranqueava acima da nova nas queries comerciais (João Pessoa 5,3 × 8,1;
 * Belém 5,7 × 7,5). `priority` alta porque são as páginas de captação — é
 * nelas que o Ads e o orgânico comercial caem.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const pageEntries: MetadataRoute.Sitemap = Object.keys(pages).map((slug) => ({
    url: absoluteUrl(slug),
    lastModified: now,
  }))

  const cityEntries: MetadataRoute.Sitemap = Object.values(CITY_LANDINGS).map((city) => ({
    url: absoluteUrl(city.slug),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.9,
  }))

  const postEntries: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: absoluteUrl(`blog/${post.slug}`),
    lastModified: new Date(post.date),
  }))

  /**
   * A landing do Semog Experience (`src/app/(evento)/experience`) cai no mesmo
   * ponto cego das landings de cidade: rota explícita, fora de `content/pages`
   * e ainda num route group irmão — nada aqui a varreria sozinha, e esse furo
   * já custou ranking uma vez. `priority` abaixo das cidades porque é peça de
   * campanha com prazo: depois de 26/09/2026 o evento passou e a entrada sai
   * daqui (item em "Antes de publicar", no plano).
   */
  const experienceEntry: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('experience'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  return [...pageEntries, ...cityEntries, ...experienceEntry, ...postEntries]
}
