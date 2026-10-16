import * as Sentry from '@sentry/nextjs'
import { ImageResponse } from 'next/og'
import { OG_CONTENT_TYPE, OG_SITE_NAME, OG_SIZE, OgCard } from '@/lib/og'
import { tituloDoOg } from '@/site/seo/og'

export const alt = OG_SITE_NAME
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/**
 * OG por página: uma rota cobre qualquer página de um segmento (`/semog`, `/solucoes`...). O
 * título sai de `tituloDoOg` (src/site/seo/og.ts), travado pelo teste site-v2-og: tirar uma
 * página de `content/pages` sem registrar o título não cai mais em silêncio no nome do site.
 * Nunca lança: erro inesperado vai ao Sentry e o card sai com o nome do site.
 *
 * Fica em `src/app/[slug]/` (raiz do App Router), e não em `(frontend)`, por dois motivos do
 * Next 16.2.6 + Turbopack (dev): arquivo especial dentro do route group nunca é registrado (cai
 * no catch-all e dá 404), e dentro da pasta do catch-all `[[...slug]]` o Turbopack recusa o
 * segmento literal depois dele. A home usa o card padrão (`src/app/opengraph-image.tsx`).
 */
function resolverTitulo(slug: string): string {
  try {
    return tituloDoOg(`/${slug}`)
  } catch (erro) {
    Sentry.captureException(erro, { tags: { origem: 'og' } })
    return OG_SITE_NAME
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return new ImageResponse(<OgCard eyebrow="SEMOG" title={resolverTitulo(slug)} />, {
    ...OG_SIZE,
  })
}
