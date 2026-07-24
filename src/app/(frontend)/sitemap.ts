import type { MetadataRoute } from 'next'
import { pages } from '@/../content/pages'
import { getPayloadClient } from '@/lib/payload'
import { absoluteUrl } from '@/lib/seo'

export const revalidate = 3600

/**
 * `/sitemap.xml` — páginas estáticas (`content/pages`, sem I/O, nunca falha)
 * + posts publicados via Local API do Payload (ainda no CMS até a Fase 2).
 * `lastModified` das páginas usa a data do build (não há `updatedAt` no
 * modelo estático) — só os posts têm uma data real de atualização.
 *
 * Nunca lança: se o DB dos posts estiver inacessível, cai pro fallback só com
 * as páginas estáticas (mesmo padrão de resiliência de `src/lib/seo.ts` e dos
 * `generateMetadata` das rotas).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const pageEntries: MetadataRoute.Sitemap = Object.keys(pages).map((slug) => ({
    url: absoluteUrl(slug),
    lastModified: now,
  }))

  try {
    const payload = await getPayloadClient()
    const posts = await payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      limit: 1000,
      depth: 0,
    })

    const postEntries: MetadataRoute.Sitemap = posts.docs.map((post) => ({
      url: absoluteUrl(`blog/${post.slug}`),
      lastModified: new Date(post.publishedAt || post.updatedAt),
    }))

    return [...pageEntries, ...postEntries]
  } catch {
    return pageEntries
  }
}
