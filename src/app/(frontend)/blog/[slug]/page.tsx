import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ImageMedia } from '@/components/Media/ImageMedia'
import { ReadingProgress } from '@/components/blog/ReadingProgress'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { getPostBySlug, getRelatedPosts, getSiteSettings } from '@/lib/payload'
import { buildMetadata } from '@/lib/seo'
import type { Category, Media, Post } from '@/payload-types'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const path = `blog/${slug}`
  try {
    const [post, settings] = await Promise.all([getPostBySlug(slug), getSiteSettings()])
    if (!post) {
      // Canonical e openGraph são omitidos intencionalmente: um 404 não deve emitir canonical apontando para si ou OG image.
      return { title: 'Página não encontrada — Semog', description: undefined }
    }
    return buildMetadata({ doc: post, settings, path, ogType: 'article' })
  } catch {
    // DB indisponível — não derruba o render, cai no fallback embutido em `buildMetadata`.
    return buildMetadata({ doc: null, settings: null, path, ogType: 'article' })
  }
}

function formatDate(date?: string | null): string | null {
  if (!date) return null
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function relatedMeta(post: Post): string | null {
  if (post.readingTime) return `Equipe Semog · ${post.readingTime} min`
  return formatDate(post.publishedAt)
}

/**
 * Página do artigo `/blog/[slug]` — layout editorial "flagship" (fora do
 * `_reference`, que só tem a listagem): barra de progresso de leitura, chip
 * de categoria, título/dek, meta (Equipe Semog · data · tempo), hero,
 * corpo tipografado (`.article-body` estiliza o lexical de `content`), caixa
 * "Em resumo" (campo `keyTakeaways`), CTA de proposta e "Continue lendo"
 * (`getRelatedPosts`, mesma categoria com fallback a recentes). Tudo numa
 * seção clara contínua (`Section light`), como o restante do blog.
 */
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const category = post.category as Category | number | null | undefined
  const categoryTitle = category && typeof category === 'object' ? category.title : null
  const categoryId = category
    ? typeof category === 'object'
      ? category.id
      : category
    : undefined
  const hero =
    post.heroImage && typeof post.heroImage === 'object' ? (post.heroImage as Media) : undefined
  const date = formatDate(post.publishedAt)
  const takeaways = (post.keyTakeaways ?? [])
    .map((item) => item.point?.trim())
    .filter((point): point is string => Boolean(point))
  const related = await getRelatedPosts(
    typeof categoryId === 'number' ? categoryId : undefined,
    post.id,
    3,
  )

  return (
    <>
      <ReadingProgress />
      <Section light>
        <Container>
          <Link href="/blog" className="article-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Voltar para o Blog
          </Link>

          <header className="article-head">
            {categoryTitle && <span className="article-cat">{categoryTitle}</span>}
            <h1>{post.title}</h1>
            {post.excerpt && <p className="article-dek">{post.excerpt}</p>}
            <div className="article-meta">
              <span className="article-avatar" aria-hidden="true">
                S
              </span>
              <span className="article-who">Equipe Semog</span>
              {date && (
                <>
                  <span className="article-dot" aria-hidden="true" />
                  <span>{date}</span>
                </>
              )}
              {post.readingTime ? (
                <>
                  <span className="article-dot" aria-hidden="true" />
                  <span>{post.readingTime} min de leitura</span>
                </>
              ) : null}
            </div>
          </header>

          {hero && (
            <figure className="article-hero">
              <ImageMedia resource={hero} fill priority sizes="(min-width: 1120px) 1120px, 100vw" />
            </figure>
          )}

          {/* `disableContainer`: renderiza os nós lexical direto em `.article-body`
              (sem o `<div class="payload-richtext">` padrão do RichText), para o
              seletor do parágrafo-lead `.article-body > p:first-of-type` casar. */}
          <div className="article-body">
            {post.content && <RichText data={post.content} disableContainer />}
          </div>

          {takeaways.length > 0 && (
            <aside className="article-resumo">
              <h2>Em resumo</h2>
              <ul>
                {takeaways.map((point) => (
                  <li key={point}>
                    <CheckIcon />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          <div className="article-cta">
            <div className="article-cta__text">
              <h2>Quer uma proposta para o seu condomínio?</h2>
              <p>Um consultor da Semog monta o diagnóstico com você — sem compromisso.</p>
            </div>
            <Link href="/proposta" className="article-cta__btn">
              Pedir proposta
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </Container>
      </Section>

      {related.length > 0 && (
        <Section light className="!pt-0">
          <Container>
            <div className="article-related-head">
              <h2 className="text-h2">Continue lendo</h2>
              <Link href="/blog" className="article-all">
                Ver todos os artigos →
              </Link>
            </div>
            <div className="posts">
              {related.map((rp) => {
                const rpCategory = rp.category as Category | number | null | undefined
                const rpCategoryTitle =
                  rpCategory && typeof rpCategory === 'object' ? rpCategory.title : null
                const rpImage =
                  rp.heroImage && typeof rp.heroImage === 'object' ? (rp.heroImage as Media) : undefined
                const meta = relatedMeta(rp)
                return (
                  <a key={rp.id} href={`/blog/${rp.slug}`} className="post">
                    <div className="pimg">
                      {rpImage && (
                        <ImageMedia
                          resource={rpImage}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        />
                      )}
                    </div>
                    <div className="pbody">
                      {rpCategoryTitle && <span className="cat">{rpCategoryTitle}</span>}
                      <h3>{rp.title}</h3>
                      {rp.excerpt && <p>{rp.excerpt}</p>}
                      {meta && <span className="meta">{meta}</span>}
                    </div>
                  </a>
                )
              })}
            </div>
          </Container>
        </Section>
      )}
    </>
  )
}
