import { pages } from '@/../content/pages'
import { findPostBySlug } from '@/lib/blog'
import { OG_SITE_NAME } from '@/lib/og'

/**
 * Título do card OG de uma URL do site, para as rotas `src/app/[slug]/opengraph-image.tsx` e
 * `src/app/blog/[slug]/opengraph-image.tsx`. Página: `meta.title`, senão `title` (a prioridade de
 * `buildMetadata`); post: o título do post. Até a virada 1 as páginas ainda moram em
 * `content/pages`; a fase que tirar uma página de lá registra o título dela aqui, e o teste
 * site-v2-og acusa a URL que ficaria com o nome do site no card.
 */
export function tituloDoOg(caminho: string): string {
  const post = /^\/blog\/([a-z0-9-]+)$/.exec(caminho)?.[1]
  if (post) return findPostBySlug(post)?.title ?? OG_SITE_NAME
  const pagina = pages[caminho.replace(/^\/+/, '') || 'home']
  return pagina?.meta?.title || pagina?.title || OG_SITE_NAME
}

/**
 * URLs do sitemap que não usam a rota dinâmica: a home usa o card padrão
 * (`src/app/opengraph-image.tsx`), e o Experience (`src/lib/experienceSeo.ts`) e as cidades
 * (`metadata` de cada rota) declaram a própria imagem.
 */
export const OG_FORA_DA_ROTA_DINAMICA: ReadonlySet<string> = new Set([
  '/',
  '/experience',
  '/administradora-de-condominios-recife',
  '/administradora-de-condominios-joao-pessoa',
  '/administradora-de-condominios-campina-grande',
  '/administradora-de-condominios-belem',
])
