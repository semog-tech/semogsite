import { ImageResponse } from 'next/og'
import { OG_CONTENT_TYPE, OG_SITE_NAME, OG_SIZE, OG_TAGLINE, OgCard } from '@/lib/og'

export const alt = OG_SITE_NAME
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/**
 * OG default do site — card de marca (nome + tagline), sem depender do CMS.
 *
 * Fica em `src/app/opengraph-image.tsx` (raiz do App Router), não em
 * `src/app/(frontend)/opengraph-image.tsx` — no Next 16.2.6 + Turbopack
 * (dev), um `opengraph-image.tsx` dentro do route group `(frontend)` nunca é
 * registrado como rota (cai direto no catch-all `[[...slug]]` e devolve
 * 404), mesmo caveat de `robots.ts` (ver comentário lá). Route groups não
 * afetam a URL, então `/opengraph-image` continua sendo servido do jeito
 * certo a partir da raiz.
 */
export default function Image() {
  return new ImageResponse(
    <OgCard eyebrow="ADMINISTRADORA DE CONDOMÍNIOS" title="Semog" subtitle={OG_TAGLINE} />,
    { ...OG_SIZE },
  )
}
