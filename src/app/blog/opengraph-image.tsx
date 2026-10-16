import * as Sentry from '@sentry/nextjs'
import { ImageResponse } from 'next/og'
import { OG_CONTENT_TYPE, OG_SITE_NAME, OG_SIZE, OgCard } from '@/lib/og'
import { tituloDoOg } from '@/site/seo/og'

export const alt = OG_SITE_NAME
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/**
 * OG do índice do blog (`/blog/opengraph-image`, o que `buildMetadata` declara para `/blog`).
 * `src/app/[slug]/opengraph-image.tsx` não o atende: a pasta `blog` existe e o segmento literal
 * vence o dinâmico, então a URL caía em `(frontend)/blog/[slug]` (404). Mesmo card e mesmo
 * título (`tituloDoOg`) do restante; nunca lança.
 */
function resolverTitulo(): string {
  try {
    return tituloDoOg('/blog')
  } catch (erro) {
    Sentry.captureException(erro, { tags: { origem: 'og' } })
    return OG_SITE_NAME
  }
}

export default function Image() {
  return new ImageResponse(<OgCard eyebrow="BLOG" title={resolverTitulo()} />, { ...OG_SIZE })
}
