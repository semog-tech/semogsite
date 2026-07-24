import { ImageResponse } from 'next/og'
import { getPostBySlug } from '@/lib/content'
import { OG_CONTENT_TYPE, OG_SITE_NAME, OG_SIZE, OgCard } from '@/lib/og'

export const alt = OG_SITE_NAME
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/**
 * Título do post lido de `content/blog/*.mdx` (Task 3 — sem Payload). Nunca
 * lança: se o post não existir, cai no nome do site.
 *
 * Fica em `src/app/blog/[slug]/opengraph-image.tsx` (raiz do App Router),
 * não em `src/app/(frontend)/blog/[slug]/opengraph-image.tsx` — mesmo
 * caveat de registro de `robots.ts`/os outros `opengraph-image.tsx` dentro
 * do route group `(frontend)` no Next 16.2.6 + Turbopack (dev): a rota
 * nunca é registrada e cai no catch-all `[[...slug]]` (404). Route groups
 * não afetam a URL, então `/blog/:slug/opengraph-image` continua sendo
 * servido do jeito certo a partir da raiz.
 */
async function resolveTitle(slug: string): Promise<string> {
  try {
    const post = await getPostBySlug(slug)
    return post?.title || OG_SITE_NAME
  } catch {
    return OG_SITE_NAME
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const title = await resolveTitle(slug)

  return new ImageResponse(<OgCard eyebrow="BLOG" title={title} />, { ...OG_SIZE })
}
