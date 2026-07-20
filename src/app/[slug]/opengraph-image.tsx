import { ImageResponse } from 'next/og'
import { OG_CONTENT_TYPE, OG_SITE_NAME, OG_SIZE, OgCard } from '@/lib/og'
import { getPageBySlug } from '@/lib/payload'

export const alt = OG_SITE_NAME
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/**
 * OG por-página, uma única rota que cobre qualquer `page` de slug único
 * (`solucoes`, `semog`, etc. — hoje nenhuma `page` usa slug com mais de um
 * segmento). Título via Local API (`meta.title` do plugin-seo > `title`
 * bruto), espelhando a prioridade de `buildMetadata` em `src/lib/seo.ts`.
 * Nunca lança — se o DB estiver fora do ar ou a page não existir, cai no
 * nome do site.
 *
 * Fica em `src/app/[slug]/opengraph-image.tsx` (raiz do App Router), não em
 * `src/app/(frontend)/[[...slug]]/opengraph-image.tsx` — por dois motivos:
 * (1) mesmo caveat de registro de `robots.ts`/`opengraph-image.tsx` default
 * dentro do route group `(frontend)` no Next 16.2.6 + Turbopack (dev); (2)
 * mesmo colocado direto na raiz, um arquivo especial dentro de uma pasta de
 * catch-all (`[[...slug]]`) é rejeitado pelo Turbopack com erro fatal
 * ("Invalid segment Static("opengraph-image"), catch all segment must be
 * the last segment") — catch-all precisa ser o último segmento da rota, e
 * `opengraph-image` adiciona um segmento literal depois dele. Como as pages
 * atuais só usam slug de um segmento, um dynamic segment simples (`[slug]`,
 * não catch-all) resolve `/solucoes/opengraph-image` sem esse problema; a
 * home (slug vazio) já é coberta pelo OG default em `src/app/opengraph-image.tsx`.
 */
async function resolveTitle(slug: string): Promise<string> {
  try {
    const page = await getPageBySlug(slug)
    return page?.meta?.title || page?.title || OG_SITE_NAME
  } catch {
    return OG_SITE_NAME
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const title = await resolveTitle(slug)

  return new ImageResponse(<OgCard eyebrow="SEMOG" title={title} />, { ...OG_SIZE })
}
