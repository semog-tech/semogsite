import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'
import type { Page, Post, SiteSettings } from '@/payload-types'

/**
 * `cache()` (React, dedupe por requisição) garante que `HeaderServer` e
 * `FooterServer` — que chamam isso de forma independente no mesmo request —
 * compartilhem uma única chamada a `getPayload`. Sem isso, duas chamadas
 * concorrentes disputam a mesma promise interna de conexão do Payload; se o
 * Postgres estiver inacessível, isso produz unhandledRejections espúrias no
 * console mesmo com o try/catch em cada chamador.
 */
export const getPayloadClient = cache(async () => {
  return getPayload({ config })
})

export const getPageBySlug = cache(async (slug: string): Promise<Page | null> => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 2,
  })
  return res.docs[0] ?? null
})

/**
 * Posts publicados mais recentes, para o bloco `BlogList` — `depth: 1`
 * resolve `category` e `heroImage` (usados no card: categoria + imagem de
 * capa). `excludeId` deixa de fora um post específico (o post em destaque do
 * bloco `BlogFeatured` logo acima na página `/blog`, pra não duplicar —
 * fiel a `_reference/blog.html`, que tem 1 destaque + 6 da grade, nunca o
 * mesmo post nos dois lugares).
 */
export const getRecentPosts = cache(async (limit = 6, excludeId?: number): Promise<Post[]> => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'posts',
    where: {
      _status: { equals: 'published' },
      ...(excludeId ? { id: { not_equals: excludeId } } : {}),
    },
    sort: '-publishedAt',
    limit,
    depth: 1,
  })
  return res.docs
})

export const getPostBySlug = cache(async (slug: string): Promise<Post | null> => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 1,
  })
  return res.docs[0] ?? null
})

/**
 * Global `site-settings` (título/descrição padrão, usados em `generateMetadata`
 * como fallback do `meta` por documento) — nunca lança: se o DB estiver fora
 * do ar, `buildMetadata` cai pro fallback embutido em `src/lib/seo.ts`.
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const payload = await getPayloadClient()
    const settings = await payload.findGlobal({ slug: 'site-settings' })
    return settings ?? null
  } catch {
    return null
  }
}
