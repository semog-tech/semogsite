import type { Metadata } from 'next'
import { pages } from '@/../content/pages'
import { site } from '@/../content/site'
import { findPostBySlug } from '@/lib/blog'
import { buildMetadata } from '@/lib/seo'
import type { PageData } from '@/types/content'

export type DocumentoLegal = 'privacidade' | 'termos'
export type PaginaDeConteudo = 'blog' | DocumentoLegal

/**
 * A página em `content/pages` que ainda guarda o `meta` do blog e dos documentos. Até a virada
 * 1 o site atual serve essas URLs com esse `meta`, e as páginas novas usam o mesmo (spec 6:
 * metadata mantida). Na virada, o `meta` muda para cá junto com a rota (DP2 do plano da fase 3).
 */
export function paginaDoConteudo(chave: PaginaDeConteudo): PageData {
  const pagina = pages[chave]
  if (!pagina) throw new Error(`[leitura] content/pages sem a página "${chave}".`)
  return pagina
}

/**
 * O `<head>` de um post: o mesmo que `src/app/(frontend)/blog/[slug]/page.tsx` monta (teste de
 * igualdade em site-v2-leitura-dados). `meta` do frontmatter primeiro; sem ele, título e resumo.
 */
export function metadadosDoPost(slug: string): Metadata {
  const post = findPostBySlug(slug)
  if (!post) return { title: 'Página não encontrada — Semog', description: undefined }
  return buildMetadata({
    doc: {
      title: post.title,
      meta: {
        title: post.meta?.title ?? post.title,
        description: post.meta?.description ?? post.excerpt,
      },
    },
    settings: site,
    path: `blog/${slug}`,
    ogType: 'article',
  })
}

/** O `<head>` do blog e dos documentos: o mesmo que o catch-all `[[...slug]]` monta hoje. */
export function metadadosDaPagina(chave: PaginaDeConteudo): Metadata {
  return buildMetadata({ doc: paginaDoConteudo(chave), settings: site, path: chave })
}
