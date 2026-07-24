import { pages } from '@/../content/pages'
import { site, type SiteConfig } from '@/../content/site'
import type { PageData } from '@/types/content'

// Reexporta as funções de POST ainda vindas do Payload — a Fase 2 as migra
// pra MDX. Mantidas aqui pra que os consumidores (`/blog`, `/blog/[slug]`)
// importem tudo de `@/lib/content` sem precisar saber quais funções já
// deixaram o Payload e quais não.
export { getPostBySlug, getRecentPosts, getRelatedPosts } from './payload'

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
