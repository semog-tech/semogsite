import { pages } from '@/../content/pages'
import { type SiteConfig, site } from '@/../content/site'
import { findPostBySlug, listRecentPosts, listRelatedPosts, type PostData } from '@/lib/blog'
import type { PageData } from '@/types/content'

export type { PostData }

/**
 * Posts publicados mais recentes, pro bloco `BlogList` — lidos de
 * `src/lib/blog.ts` (MDX, sem banco). `excludeSlug` tira o post em destaque
 * de um `BlogFeatured` acima na mesma página, pra não duplicar (fiel a
 * `_reference/blog.html`, que tem 1 destaque + 6 da grade, nunca o mesmo post
 * nos dois lugares). Assíncrona por convenção (mesmo formato do antigo
 * `getRecentPosts` do Payload), embora não haja I/O de fato.
 */
export async function getRecentPosts(limit = 6, excludeSlug?: string): Promise<PostData[]> {
  return listRecentPosts(limit, excludeSlug)
}

/**
 * Posts relacionados para o "Continue lendo" de `/blog/[slug]`. Prioriza a
 * mesma `category` do post atual e completa com os mais recentes de outras
 * categorias quando não há publicados suficientes — sem duplicar e sempre
 * excluindo o próprio (`excludeSlug`, no lugar do `excludeId` numérico de
 * quando os posts vinham do Payload).
 */
export async function getRelatedPosts(
  category: string | undefined,
  excludeSlug: string,
  limit = 3,
): Promise<PostData[]> {
  return listRelatedPosts(category, excludeSlug, limit)
}

/** Post por slug (MDX, `src/lib/blog.ts`) — usado por `/blog/[slug]` e pelo OG image da rota. */
export async function getPostBySlug(slug: string): Promise<PostData | null> {
  return findPostBySlug(slug)
}

/**
 * Página estática por slug. Sem banco: lê direto do índice `content/pages`
 * (Task 4). Assíncrona de propósito — mantém a MESMA assinatura de
 * `getPageBySlug` em `src/lib/payload.ts`, pra o catch-all e `generateMetadata`
 * não precisarem mudar a forma de chamar.
 */
export async function getPageBySlug(slug: string): Promise<PageData | null> {
  return pages[slug] ?? null
}

/**
 * Config global do site (título/descrição/OG padrão) — lida de `content/site.ts`.
 * Nunca falha (não há I/O), mas continua `Promise`/`| null` pra bater com a
 * assinatura de `getSiteSettings` em `src/lib/payload.ts`.
 */
export async function getSiteSettings(): Promise<SiteConfig | null> {
  return site
}
