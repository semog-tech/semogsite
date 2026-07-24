import type { Block } from './blocks'

/**
 * Uma página estática: o que o catch-all e o `RenderBlocks` precisam.
 *
 * `title` é o rótulo administrativo da página no Payload (ex.: "Soluções",
 * "Semog Garante") — distinto de `meta.title` (só preenchido quando alguém
 * customiza o SEO; a maioria das páginas não tem). `buildMetadata`
 * (`src/lib/seo.ts`) usa `title` como fallback do `<title>` quando `meta.title`
 * está vazio, e `getPageJsonLd` usa `title` como nome do item no
 * `BreadcrumbList`. Sem esse campo, TODAS as páginas sem `meta.title` próprio
 * cairiam no título genérico do site — uma regressão de SEO, não só de tipo.
 */
export interface PageData {
  slug: string
  title?: string | null
  meta?: { title?: string | null; description?: string | null; image?: string | null }
  layout: Block[]
}
