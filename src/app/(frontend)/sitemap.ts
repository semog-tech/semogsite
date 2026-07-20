import type { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { absoluteUrl } from '@/lib/seo'

export const revalidate = 3600

/**
 * `/sitemap.xml` — pages + posts publicados via Local API. Nunca lança: se o
 * DB estiver inacessível, cai pro fallback com só a home (o build não pode
 * quebrar por causa disso — mesmo padrão de resiliência de `src/lib/seo.ts`
 * e dos `generateMetadata` das rotas).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const payload = await getPayloadClient()

    const [pages, posts] = await Promise.all([
      payload.find({
        collection: 'pages',
        where: { _status: { equals: 'published' } },
        limit: 1000,
        depth: 0,
      }),
      payload.find({
        collection: 'posts',
        where: { _status: { equals: 'published' } },
        limit: 1000,
        depth: 0,
      }),
    ])

    const pageEntries: MetadataRoute.Sitemap = pages.docs.map((page) => ({
      url: absoluteUrl(page.slug),
      lastModified: new Date(page.updatedAt),
    }))

    const postEntries: MetadataRoute.Sitemap = posts.docs.map((post) => ({
      url: absoluteUrl(`blog/${post.slug}`),
      lastModified: new Date(post.publishedAt || post.updatedAt),
    }))

    return [...pageEntries, ...postEntries]
  } catch {
    return [{ url: absoluteUrl(''), lastModified: new Date() }]
  }
}
