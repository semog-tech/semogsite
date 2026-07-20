import { ImageMedia } from '@/components/Media/ImageMedia'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { getRecentPosts } from '@/lib/payload'
import { Stagger } from '@/motion/reveal'
import type { BlogListBlock as BlogListBlockType, Category, Media } from '@/payload-types'

function formatDate(date?: string | null): string | null {
  if (!date) return null
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Grid de posts publicados (`getRecentPosts`), fiel a `.posts`/`.post` de
 * `_reference/blog.html:169-224` (CSS portado verbatim pra `theme.css`, ver
 * `BlogList/config.ts`): imagem de capa (`heroImage`) + categoria + título +
 * excerto + meta ("Equipe Semog · N min", de `post.readingTime` — cai para a
 * data formatada quando o post não tem `readingTime`, ex.: conteúdo legado).
 * `excludePost` tira o post em destaque de um `BlogFeatured` acima da grade
 * (evita duplicar); `tightTop` zera o padding-top da seção quando este bloco
 * vem logo depois de um `BlogFeatured` (mesma seção clara contínua do ref —
 * ver doc do campo em `config.ts`). Server component assíncrono: busca os
 * posts no próprio render, sem passar por client state.
 */
export async function BlogListBlock({ title, limit, excludePost, tightTop }: BlogListBlockType) {
  const excludeId =
    excludePost && typeof excludePost === 'object' ? excludePost.id : (excludePost ?? undefined)
  const posts = await getRecentPosts(limit ?? 6, excludeId)
  if (posts.length === 0) return null

  return (
    <Section light className={tightTop ? '!pt-0' : ''}>
      <Container>
        {title && (
          <div className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
            <h2 className="text-h2">{title}</h2>
          </div>
        )}
        <Stagger className="posts">
          {posts.map((post) => {
            const category = post.category as Category | number | null | undefined
            const categoryTitle = category && typeof category === 'object' ? category.title : null
            const image =
              post.heroImage && typeof post.heroImage === 'object'
                ? (post.heroImage as Media)
                : undefined
            const meta = post.readingTime
              ? `Equipe Semog · ${post.readingTime} min`
              : formatDate(post.publishedAt)

            return (
              <a key={post.id} href={`/blog/${post.slug}`} className="post">
                <div className="pimg">
                  {image && (
                    <ImageMedia
                      resource={image}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
                  )}
                </div>
                <div className="pbody">
                  {categoryTitle && <span className="cat">{categoryTitle}</span>}
                  <h3>{post.title}</h3>
                  {post.excerpt && <p>{post.excerpt}</p>}
                  {meta && <span className="meta">{meta}</span>}
                </div>
              </a>
            )
          })}
        </Stagger>
      </Container>
    </Section>
  )
}
