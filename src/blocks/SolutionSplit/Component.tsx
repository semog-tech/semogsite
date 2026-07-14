import { ImageMedia } from '@/components/Media/ImageMedia'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/motion/reveal'
import type { Media, SolutionSplitBlock as SolutionSplitBlockType } from '@/payload-types'

type Item = NonNullable<SolutionSplitBlockType['items']>[number]

/** `.svc-tags`, fiel a `_reference/solucoes.html:423-431`/`:455-462`. */
function SvcTags({ tags }: { tags: Item['tags'] }) {
  if (!tags || tags.length === 0) return null
  return (
    <div className="svc-tags">
      {tags.map((tag) => (
        <span key={tag.id ?? tag.label}>{tag.label}</span>
      ))}
    </div>
  )
}

/** Coluna de texto de um `.split` (kicker + h2 + texto + `.svc-tags`). */
function TextCol({ item, dir }: { item: Item; dir: 'left' | 'right' }) {
  return (
    <Reveal dir={dir}>
      {item.kicker && <span className="kicker">{item.kicker}</span>}
      <h2>{item.title}</h2>
      {item.text && <p className="max-w-[50ch] text-fg-2">{item.text}</p>}
      <SvcTags tags={item.tags} />
    </Reveal>
  )
}

/** Coluna de imagem de um `.split` (`.split-media`). */
function MediaCol({ item, dir }: { item: Item; dir: 'left' | 'right' }) {
  const image = item.image && typeof item.image === 'object' ? (item.image as Media) : undefined
  if (!image) return null
  return (
    <Reveal dir={dir} className="split-media">
      <ImageMedia resource={image} sizes="(min-width: 861px) 50vw, 100vw" />
    </Reveal>
  )
}

/**
 * Vertical em `.split` (residenciais/comerciais), fiel a
 * `_reference/solucoes.html:412-466`. `reversed` alterna a ordem das
 * colunas — a direção do `Reveal` segue a posição (1ª coluna sempre
 * `dir="left"`, 2ª sempre `dir="right"`), não o conteúdo.
 */
function SplitItem({ item }: { item: Item }) {
  return (
    <Section light className="vertical">
      <Container>
        <div className="split">
          {item.reversed ? (
            <>
              <MediaCol item={item} dir="left" />
              <TextCol item={item} dir="right" />
            </>
          ) : (
            <>
              <TextCol item={item} dir="left" />
              <MediaCol item={item} dir="right" />
            </>
          )}
        </div>
      </Container>
    </Section>
  )
}

/**
 * Vertical full-bleed (associações), fiel a
 * `_reference/solucoes.html:469-484`: imagem + overlay (`.assoc::after`,
 * CSS) + `.assoc-body` com kicker/h2/texto/`link-arrow`.
 */
function AssocItem({ item }: { item: Item }) {
  const image = item.image && typeof item.image === 'object' ? (item.image as Media) : undefined
  return (
    <Section light className="vertical">
      <Container>
        <Reveal dir="scale" className="assoc">
          {image && <ImageMedia resource={image} fill sizes="(min-width: 1024px) 1120px, 100vw" />}
          <div className="assoc-body">
            {item.kicker && <span className="kicker">{item.kicker}</span>}
            <h2 className="text-[clamp(1.7rem,3.2vw,2.6rem)]">{item.title}</h2>
            {item.text && <p className="mb-[1.4rem]">{item.text}</p>}
            {item.ctaLabel && item.ctaHref && (
              <a className="link-arrow" href={item.ctaHref}>
                {item.ctaLabel}
                <span className="arr" aria-hidden="true">
                  →
                </span>
              </a>
            )}
          </div>
        </Reveal>
      </Container>
    </Section>
  )
}

/**
 * As 3 verticais residencial/comercial/associações, fiel a
 * `_reference/solucoes.html:411-484` (`.vertical.sec-light`). Cada item do
 * array vira sua própria `<section>` — o ref não tem cabeçalho comum às 3.
 */
export function SolutionSplitBlock({ items }: SolutionSplitBlockType) {
  if (!items || items.length === 0) return null

  return (
    <>
      {items.map((item) =>
        item.variant === 'assoc' ? (
          <AssocItem key={item.id ?? item.title} item={item} />
        ) : (
          <SplitItem key={item.id ?? item.title} item={item} />
        ),
      )}
    </>
  )
}
