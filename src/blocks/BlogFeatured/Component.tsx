import { ImageMedia } from '@/components/Media/ImageMedia'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { getPostBySlug } from '@/lib/content'
import { Reveal } from '@/motion/reveal'
import type { BlogFeaturedBlock as BlogFeaturedBlockType } from '@/types/blocks'
import type { PostData } from '@/lib/blog'

function metaLine(post: PostData): string {
  return post.readingTime ? `Equipe Semog · ${post.readingTime} min de leitura` : 'Equipe Semog'
}

/**
 * `.featured` fiel a `_reference/blog.html:156-166` + CSS em
 * `_reference/blog.html:49-63` (estilo inline da própria página, portado
 * verbatim pra `theme.css`): card de 2 colunas (`1.25fr 0.75fr`) — imagem à
 * esquerda com zoom no hover, corpo à direita (categoria/título/excerto/
 * meta). Vive dentro da MESMA seção clara (`.sec-light`) que a grade
 * `BlogList` logo abaixo — por isso `Section light` aqui zera o
 * padding-bottom (`!pb-0`, a grade fornece o próprio espaçamento via
 * `.posts{margin-top:1.4rem}` + seu padding-bottom normal) e usa o
 * padding-top exato do ref (`clamp(2.5rem,5vw,4rem)`, ver
 * `_reference/blog.html:153`) em vez do `--section` genérico do `Section`.
 *
 * `post` é o SLUG do destaque (não mais um snapshot/id numérico — Task 3):
 * o bloco resolve o `PostData` completo direto de `src/lib/blog.ts` via
 * `getPostBySlug` no próprio render, mesma fonte única (MDX) que `BlogList`.
 * Isso elimina o snapshot duplicado que `content/pages/blog.ts` mantinha
 * antes da migração (risco de o snapshot ficar desatualizado se o post
 * mudasse).
 *
 * O ref envolve o card inteiro num único `<a data-reveal>`; aqui o `Reveal`
 * (equivalente React de `[data-reveal]`, `src/motion/reveal.tsx`) não
 * repassa `href`, então o card é um `div` animado com um link "esticado"
 * absoluto por cima (mesmo padrão de `ProdCard`/`SolCard`) — precisa de
 * `position:relative` em `.featured`, que o ref não tinha (adicionado em
 * `theme.css`, sem efeito visual).
 */
export async function BlogFeaturedBlock({ post: slug }: BlogFeaturedBlockType) {
  const featured = await getPostBySlug(slug)
  if (!featured) return null

  return (
    <Section light className="!pt-[clamp(2.5rem,5vw,4rem)] !pb-0">
      <Container>
        <Reveal className="featured">
          <div className="fimg">
            {featured.heroImage && (
              <ImageMedia
                resource={featured.heroImage}
                fill
                sizes="(min-width: 860px) 55vw, 100vw"
              />
            )}
          </div>
          <div className="fbody">
            {featured.categoryTitle && <span className="cat">{featured.categoryTitle}</span>}
            <h2>{featured.title}</h2>
            {featured.excerpt && <p>{featured.excerpt}</p>}
            <span className="meta">{metaLine(featured)}</span>
          </div>
          <a href={`/blog/${featured.slug}`} className="absolute inset-0 z-10">
            <span className="sr-only">Ler o artigo em destaque: {featured.title}</span>
          </a>
        </Reveal>
      </Container>
    </Section>
  )
}
