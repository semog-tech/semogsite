import type { Metadata } from 'next'
import { pages } from '@/../content/pages'
import { site } from '@/../content/site'
import { buildMetadata, getPageJsonLd } from '@/lib/seo'
import type { PageData } from '@/types/content'

export type PaginaInstitucional =
  | 'home'
  | 'semog'
  | 'administracao-de-condominios'
  | 'garante'
  | 'incorporadoras'
  | 'tecnologia'
  | 'solucoes'
  | 'proposta'
  | 'contato'

/** /tecnologia é URL nova: título e descrição do protótipo (`paginas.json`), aprovados com ele. */
export const META_DA_TECNOLOGIA = {
  title: 'Tecnologia · Semog One, a plataforma própria da Semog',
  description:
    'Semog One, a plataforma própria da Semog, construída sobre o ERP. Um mês de condomínio: 2ª via pelo site e pelo WhatsApp, cobrança com equipe própria, assembleias digitais e prestação de contas conferida.',
} as const

/**
 * O título do Contato no ar ("telefone e WhatsApp das quatro unidades") promete um WhatsApp que o
 * Contato do v2 não oferece a quem não é cliente (spec 5). Decisão de 16/10/2026: o v2 usa este
 * título, e o resto do `meta` é o de hoje. O site no ar, inclusive o card OG de /contato (rota
 * `src/app/[slug]/opengraph-image.tsx`), só muda na virada, quando o `meta` vem para cá.
 */
export const TITULO_DO_CONTATO = 'Contato Semog: telefones e endereços das quatro Unidades'

/**
 * A página em `content/pages` que guarda o `meta` de hoje. Até a virada 1 o site atual serve
 * essas URLs com esse `meta`, e as páginas novas usam o mesmo (spec 6: metadata mantida). Na
 * virada, o `meta` vem para cá junto com a rota, como na fase 3.
 */
function documento(pagina: PaginaInstitucional): PageData {
  if (pagina === 'tecnologia') {
    return { slug: 'tecnologia', title: 'Tecnologia', meta: { ...META_DA_TECNOLOGIA }, layout: [] }
  }
  const doc = pages[pagina]
  if (!doc) throw new Error(`[institucional] content/pages sem a página "${pagina}".`)
  if (pagina === 'contato') return { ...doc, meta: { ...doc.meta, title: TITULO_DO_CONTATO } }
  return doc
}

/** O `<head>` da página: o mesmo que o catch-all `[[...slug]]` monta hoje (teste site-v2-rotas). */
export function metadadosInstitucionais(pagina: PaginaInstitucional): Metadata {
  return buildMetadata({ doc: documento(pagina), settings: site, path: pagina })
}

/** JSON-LD da página: Organization na home, BreadcrumbList nas demais (`getPageJsonLd`). */
export function jsonLdInstitucional(pagina: PaginaInstitucional): Record<string, unknown> | null {
  return getPageJsonLd({ page: documento(pagina), path: pagina })
}
