import * as Sentry from '@sentry/nextjs'
import { ImageResponse } from 'next/og'
import { OG_CONTENT_TYPE, OG_SITE_NAME, OG_SIZE, OgCard } from '@/lib/og'
import { tituloDoOg } from '@/site/seo/og'

export const alt = OG_SITE_NAME
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/**
 * OG dos posts: o título vem de `content/blog/*.mdx`, por `tituloDoOg` (src/site/seo/og.ts).
 * Nunca lança: erro inesperado vai ao Sentry e o card sai com o nome do site.
 *
 * Fica em `src/app/blog/[slug]/` (raiz do App Router), e não em `(frontend)/blog/[slug]/`: no
 * Next 16.2.6 + Turbopack (dev), arquivo especial dentro do route group nunca é registrado e cai
 * no catch-all (404). Route groups não afetam a URL: `/blog/<slug>/opengraph-image` é servido
 * daqui.
 */
function resolverTitulo(slug: string): string {
  try {
    return tituloDoOg(`/blog/${slug}`)
  } catch (erro) {
    Sentry.captureException(erro, { tags: { origem: 'og' } })
    return OG_SITE_NAME
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return new ImageResponse(<OgCard eyebrow="BLOG" title={resolverTitulo(slug)} />, {
    ...OG_SIZE,
  })
}
