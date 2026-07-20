import { ImageResponse } from 'next/og'
import { OG_CONTENT_TYPE, OG_SITE_NAME, OG_SIZE, OgCard } from '@/lib/og'
import { getPostBySlug } from '@/lib/payload'

export const alt = OG_SITE_NAME
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/**
 * Título do post via Local API, espelhando a prioridade de `buildMetadata`
 * em `src/lib/seo.ts`. Nunca lança — se o DB estiver fora do ar ou o post
 * não existir (ou não estiver publicado), cai no nome do site.
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
    return post?.meta?.title || post?.title || OG_SITE_NAME
  } catch {
    return OG_SITE_NAME
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const title = await resolveTitle(slug)

  return new ImageResponse(<OgCard eyebrow="BLOG" title={title} />, { ...OG_SIZE })
}
