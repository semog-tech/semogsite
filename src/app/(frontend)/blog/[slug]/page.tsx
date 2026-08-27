import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { PostImage } from '@/components/blog/PostImage'
import { PostVideo } from '@/components/blog/PostVideo'
import { ReadingProgress } from '@/components/blog/ReadingProgress'
import { ImageMedia } from '@/components/Media/ImageMedia'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import type { PostData } from '@/lib/blog'
import { getPostBySlug, getRelatedPosts, getSiteSettings } from '@/lib/content'
import { buildMetadata } from '@/lib/seo'

export const revalidate = 3600

/**
 * Componentes disponíveis dentro de um post `.mdx` (27/08/2026). Até aqui o
 * `MDXRemote` rodava sem `components`, então nenhuma tag JSX maiúscula
 * funcionava no corpo — só markdown puro.
 *
 * O mapa é deliberadamente mínimo. Cada componente aqui vira contrato público
 * do conteúdo: um post que usa `<PostVideo />` quebra o build se o componente
 * sair, e quem escreve MDX não vê o TypeScript reclamar antes disso. Só entra
 * o que o markdown não consegue expressar — vídeo e foto com legenda são os
 * casos (o `![]()` do markdown não rende `<figure>`/`<figcaption>` nem passa
 * pelo `next/image`); título, lista e citação não são.
 */
const MDX_COMPONENTS = { PostVideo, PostImage }

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
    // `PostData` (MDX) não tem grupo `meta` de SEO por doc, mas o `excerpt` do
    // frontmatter já É uma meta description — sem passá-lo aqui, todos os posts
    // herdavam a MESMA descrição genérica do site (`defaultDescription`), que é
    // o que derruba o CTR na busca. O sufixo curto evita o título truncado: o
    // fallback de `buildMetadata` acrescenta a marca inteira, e os títulos dos
    // posts já são longos. Se um post ficar sem `excerpt`, cai no padrão.
    return buildMetadata({
      doc: {
        title: post.title,
        meta: { title: `${post.title} | Semog`, description: post.excerpt },
      },
      settings,
      path,
      ogType: 'article',
    })
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

function relatedMeta(post: PostData): string | null {
  if (post.readingTime) return `Equipe Semog · ${post.readingTime} min`
  return formatDate(post.date)
}

/**
 * Página do artigo `/blog/[slug]` — layout editorial "flagship" (fora do
 * `_reference`, que só tem a listagem): barra de progresso de leitura, chip
 * de categoria, título/dek, meta (Equipe Semog · data · tempo), hero,
 * corpo em MDX (`.article-body` estiliza por tag — `p`/`h2`/`ul`/`a`/
 * `blockquote` — os mesmos seletores que já valiam pro lexical do Payload,
 * ver `RichText/Component.tsx`), caixa "Em resumo" (`post.keyTakeaways`),
 * CTA de proposta e "Continue lendo" (`getRelatedPosts`, mesma categoria com
 * fallback a recentes — agora por `category`/slug, sem id numérico).
 */
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const date = formatDate(post.date)
  const takeaways = post.keyTakeaways ?? []
  const related = await getRelatedPosts(post.category, post.slug, 3)

  return (
    <>
      <ReadingProgress />
      <Section light>
        <Container>
          <Link href="/blog" className="article-back">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Voltar para o Blog
          </Link>

          <header className="article-head">
            {post.categoryTitle && <span className="article-cat">{post.categoryTitle}</span>}
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

          {post.heroImage && (
            <figure className="article-hero">
              <ImageMedia
                resource={post.heroImage}
                fill
                priority
                sizes="(min-width: 1120px) 1120px, 100vw"
              />
            </figure>
          )}

          <div className="article-body">
            <MDXRemote source={post.body} components={MDX_COMPONENTS} />
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
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                aria-hidden="true"
              >
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
                const meta = relatedMeta(rp)
                return (
                  <a key={rp.slug} href={`/blog/${rp.slug}`} className="post">
                    <div className="pimg">
                      {rp.heroImage && (
                        <ImageMedia
                          resource={rp.heroImage}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        />
                      )}
                    </div>
                    <div className="pbody">
                      {rp.categoryTitle && <span className="cat">{rp.categoryTitle}</span>}
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
