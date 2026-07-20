import { ImageMedia } from '@/components/Media/ImageMedia'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/motion/reveal'
import type { Media, ProdutosGridBlock as ProdutosGridBlockType } from '@/payload-types'

type Card = NonNullable<ProdutosGridBlockType['cards']>[number]

/** Delays do ref (`_reference/index.html:637-671`): 0 / 0.1 / 0.15 / 0.2. */
const REVEAL_DELAYS = [0, 0.1, 0.15, 0.2]

/** Seta "go" — fiel ao svg de `.prod-card .go` (`_reference/index.html:644`). */
function GoArrow() {
  return (
    <span className="go" aria-hidden="true">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </span>
  )
}

/**
 * Um `.prod-card.{theme}`. Assim como o `SolCard`, o card inteiro é um link
 * no ref — reproduzido aqui como `div` (item do grid, animado por `Reveal`)
 * com um link "stretched" absoluto quando há `href`, já que `Reveal` não
 * repassa `href` ao elemento renderizado.
 */
function ProdCard({ card, delay }: { card: Card; delay: number }) {
  const image = card.image && typeof card.image === 'object' ? (card.image as Media) : undefined

  return (
    <Reveal delay={delay} className={`prod-card ${card.theme ?? 'on-white'}`}>
      {card.href && (
        <a href={card.href} className="absolute inset-0 z-10">
          <span className="sr-only">{card.title}</span>
        </a>
      )}
      <div className="txt">
        {card.tag && <span className="tag">{card.tag}</span>}
        <h3>{card.title}</h3>
        <p>{card.text}</p>
      </div>
      <div className="img">
        {image && <ImageMedia resource={image} fill sizes="(min-width: 900px) 50vw, 100vw" />}
      </div>
      <GoArrow />
    </Reveal>
  )
}

/**
 * Fiel à `.prods.sec-light.white` de `_reference/index.html:628-674`: grade
 * 2x2 de `.prod-card` (`.prod-grid`), cada um num tema claro/escuro próprio
 * definido no CMS (`theme`). Seção clara (`sec-light white`), como no ref.
 */
export function ProdutosGridBlock({ eyebrow, title, cards }: ProdutosGridBlockType) {
  if (!cards || cards.length === 0) return null

  return (
    <Section light white className="prods">
      <Container>
        {(eyebrow || title) && (
          <div className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <h2 className="text-h2">{title}</h2>}
          </div>
        )}
        <div className="prod-grid">
          {cards.map((card, i) => (
            <ProdCard
              key={card.id ?? card.title}
              card={card}
              delay={REVEAL_DELAYS[i] ?? i * 0.05}
            />
          ))}
        </div>
      </Container>
    </Section>
  )
}
