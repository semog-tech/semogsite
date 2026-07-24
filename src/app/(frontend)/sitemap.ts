import type { MetadataRoute } from 'next'
import { pages } from '@/../content/pages'
import { getAllPosts } from '@/lib/blog'
import { absoluteUrl } from '@/lib/seo'

export const revalidate = 3600

/**
 * `/sitemap.xml` — páginas estáticas (`content/pages`) + posts (`content/blog/
 * *.mdx`, via `src/lib/blog.ts` — Task 3, sem mais Payload). `lastModified`
 * das páginas usa a data do build (não há `updatedAt` no modelo estático); os
 * posts usam a própria `date` do frontmatter.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const pageEntries: MetadataRoute.Sitemap = Object.keys(pages).map((slug) => ({
    url: absoluteUrl(slug),
    lastModified: now,
  }))

  const postEntries: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: absoluteUrl(`blog/${post.slug}`),
    lastModified: new Date(post.date),
  }))

  return [...pageEntries, ...postEntries]
}
