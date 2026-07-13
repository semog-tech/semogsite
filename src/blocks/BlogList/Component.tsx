import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { getRecentPosts } from '@/lib/payload'
import type { BlogListBlock as BlogListBlockType, Category } from '@/payload-types'

function formatDate(date?: string | null): string | null {
  if (!date) return null
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Grid de posts publicados (`getRecentPosts`), no mesmo padrão de card de
 * `.post` em `_reference/blog.html`: categoria, título, excerpt e data —
 * sem imagem por ora (upload S3 fica para uma task futura). Server
 * component assíncrono: busca os posts no próprio render, sem passar por
 * client state.
 */
export async function BlogListBlock({ title, limit }: BlogListBlockType) {
  const posts = await getRecentPosts(limit ?? 6)
  if (posts.length === 0) return null

  return (
    <Section>
      <Container>
        {title && (
          <div className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
            <h2 className="text-h2">{title}</h2>
          </div>
        )}
        <div className="grid grid-cols-1 gap-[1.4rem] sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const category = post.category as Category | number | null | undefined
            const categoryTitle = category && typeof category === 'object' ? category.title : null
            const date = formatDate(post.publishedAt)

            return (
              <a
                key={post.id}
                href={`/blog/${post.slug}`}
                className="flex h-full flex-col gap-[0.6rem] rounded-card border border-line bg-[linear-gradient(180deg,rgba(173,213,235,0.045),rgba(173,213,235,0.01))] p-[1.6rem] transition-[transform,border-color] duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[5px] hover:border-line-strong"
              >
                {categoryTitle && (
                  <span className="text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-ice-500">
                    {categoryTitle}
                  </span>
                )}
                <h3 className="m-0 text-[1.2rem] leading-[1.25]">{post.title}</h3>
                {post.excerpt && (
                  <p className="m-0 flex-1 text-[0.92rem] text-fg-2">{post.excerpt}</p>
                )}
                {date && <span className="text-[0.82rem] text-fg-3">{date}</span>}
              </a>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}
