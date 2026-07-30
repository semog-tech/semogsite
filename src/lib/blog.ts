import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { categories } from '@/../content/blog/categories'
import { img } from '@/../content/media'
import type { Media } from '@/types/media'

/**
 * Post do blog, lido direto de `content/blog/*.mdx` (frontmatter + corpo) —
 * substitui o `Post` gerado pelo Payload. `category`/`categoryTitle`: o
 * frontmatter só guarda o slug da categoria (`financas`, `gestao`...);
 * `categoryTitle` já vem resolvido contra `content/blog/categories.ts` pra
 * nenhum consumidor (`BlogList`/`BlogFeatured`/`blog/[slug]`) precisar
 * importar as categorias só pra exibir o rótulo. `readingTime`/
 * `keyTakeaways` são opcionais no tipo mas hoje presentes nos 11 posts —
 * portados de `src/seed/posts.ts` (fonte original) pro frontmatter na Task 3,
 * porque alimentam UI visível em produção (meta "Equipe Semog · N min" dos
 * cards e a caixa "Em resumo" do artigo) que a conversão da Task 2 não
 * preservou. `body`: o MDX cru (sem o frontmatter), renderizado via
 * `next-mdx-remote/rsc` por quem consome (`blog/[slug]/page.tsx`).
 */
export interface PostData {
  slug: string
  title: string
  excerpt: string
  category: string
  categoryTitle: string | null
  date: string
  heroImage?: Media
  readingTime?: number
  keyTakeaways?: string[]
  body: string
}

// `vitest`/Next rodam com cwd na raiz do repo — mesmo padrão já usado em
// `tests/int/content-blog.int.spec.ts`.
const BLOG_DIR = path.resolve(process.cwd(), 'content/blog')

function resolveCategoryTitle(slug: string): string | null {
  return categories.find((c) => c.slug === slug)?.title ?? null
}

/**
 * `heroImage` no frontmatter é só a URL pública do storage (string) — aqui
 * vira `Media` ({url, alt, width, height}) via `content/media.ts` (mesmo
 * helper usado pelo resto do conteúdo estático), resolvendo o filename a
 * partir da URL. Preserva alt/dimensões reais em vez do fallback genérico.
 */
function resolveHeroImage(url: string | undefined): Media | undefined {
  if (!url) return undefined
  const filename = url.split('/').pop()
  if (!filename) return { url }
  try {
    return img(filename)
  } catch {
    // Filename sem alt mapeado em `content/media.ts` — não deveria acontecer
    // com os posts atuais, mas não trava o build por causa disso.
    return { url }
  }
}

function parsePost(file: string): PostData {
  const raw = readFileSync(path.join(BLOG_DIR, file), 'utf8')
  const { data, content } = matter(raw)
  const category = String(data.category)
  return {
    slug: String(data.slug),
    title: String(data.title),
    excerpt: String(data.excerpt ?? ''),
    category,
    categoryTitle: resolveCategoryTitle(category),
    date: String(data.date),
    heroImage: resolveHeroImage(data.heroImage as string | undefined),
    readingTime: typeof data.readingTime === 'number' ? data.readingTime : undefined,
    keyTakeaways: Array.isArray(data.keyTakeaways) ? (data.keyTakeaways as string[]) : undefined,
    body: content.trim(),
  }
}

/**
 * Lidos uma vez no import do módulo (dado estático, sem watch em runtime —
 * mesmo padrão de `content/pages`/`content/blog/categories.ts`; um post
 * novo/editado exige rebuild, não é servido "ao vivo"). Ordenados por data
 * decrescente, a ordem que todo consumidor (`getRecentPosts`) espera.
 */
const ALL_POSTS: PostData[] = readdirSync(BLOG_DIR)
  .filter((f) => f.endsWith('.mdx'))
  .map(parsePost)
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

/** Todos os posts, já ordenados por data desc — usado pelo `/sitemap.xml`. */
export function getAllPosts(): PostData[] {
  return ALL_POSTS
}

export function findPostBySlug(slug: string): PostData | null {
  return ALL_POSTS.find((post) => post.slug === slug) ?? null
}

/** Mais recentes, opcionalmente excluindo um slug (o destaque de `BlogFeatured`, pra não duplicar na grade). */
export function listRecentPosts(limit: number, excludeSlug?: string): PostData[] {
  const posts = excludeSlug ? ALL_POSTS.filter((post) => post.slug !== excludeSlug) : ALL_POSTS
  return posts.slice(0, limit)
}

/**
 * Relacionados ao post `excludeSlug`: prioriza a mesma `category` e completa
 * com os mais recentes de qualquer categoria (sem duplicar, sem o próprio) —
 * porte 1:1 da lógica de `getRelatedPosts` em `src/lib/payload.ts`.
 */
export function listRelatedPosts(
  category: string | undefined,
  excludeSlug: string,
  limit: number,
): PostData[] {
  const sameCategory = category
    ? ALL_POSTS.filter((post) => post.category === category && post.slug !== excludeSlug).slice(
        0,
        limit,
      )
    : []

  if (sameCategory.length >= limit) return sameCategory

  const chosen = new Set([excludeSlug, ...sameCategory.map((post) => post.slug)])
  const filler = ALL_POSTS.filter((post) => !chosen.has(post.slug)).slice(
    0,
    limit - sameCategory.length,
  )
  return [...sameCategory, ...filler]
}
