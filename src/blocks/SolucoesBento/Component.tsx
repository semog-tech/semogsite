import { ImageMedia } from '@/components/Media/ImageMedia'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/motion/reveal'
import type { Media, SolucoesBentoBlock as SolucoesBentoBlockType } from '@/payload-types'

type Card = NonNullable<SolucoesBentoBlockType['cards']>[number]

/** Seta "go" — fiel ao svg de `.sol-card .go` (`_reference/index.html:594`). */
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
 * Um `.sol-card`. O card inteiro é clicável no ref (`<a class="sol-card">`),
 * mas `Reveal` não repassa `href` para o `as` (só `children`/`dir`/`delay`/
 * `className`) — por isso o card fica como `div` (item do grid, animado pelo
 * `Reveal`) com um link "stretched" absoluto por cima quando há `href`; o
 * `:hover` do CSS continua disparando normalmente porque ele reage a
 * qualquer descendente sob o ponteiro, não só à âncora.
 */
function SolCard({ card, tall, delay }: { card: Card; tall: boolean; delay: number }) {
  const image = card.image && typeof card.image === 'object' ? (card.image as Media) : undefined

  return (
    <Reveal delay={delay} className={`sol-card${tall ? ' tall' : ''}`}>
      {card.href && (
        <a href={card.href} className="absolute inset-0 z-10">
          <span className="sr-only">{card.title}</span>
        </a>
      )}
      <div className="card-img">
        {image && (
          <ImageMedia
            resource={image}
            fill
            sizes={tall ? '(min-width: 1024px) 58vw, 100vw' : '(min-width: 1024px) 42vw, 100vw'}
          />
        )}
      </div>
      <div className="sol-body">
        <div>
          {card.tag && <span className="tag">{card.tag}</span>}
          <h3>{card.title}</h3>
          <p>{card.text}</p>
        </div>
        <GoArrow />
      </div>
    </Reveal>
  )
}

/**
 * Fiel à `.solutions` de `_reference/index.html:576-625`: bento com 1 card
 * alto (`.sol-grid > .sol-card.tall`) + os demais empilhados em `.sol-col`.
 * O card marcado `tall` no CMS vira o alto; sem nenhum marcado, o primeiro
 * item assume esse papel. Zoom da imagem e giro do "go" no hover vêm do CSS
 * `.sol-card`/`.card-img`/`.go` portado para `theme.css`.
 */
export function SolucoesBentoBlock({ eyebrow, title, cards }: SolucoesBentoBlockType) {
  if (!cards || cards.length === 0) return null

  const tallIndex = cards.findIndex((c) => c.tall)
  const tallCard = tallIndex >= 0 ? cards[tallIndex] : cards[0]
  const stackCards = cards.filter((c) => c !== tallCard)

  return (
    <Section className="solutions">
      <Container>
        {(eyebrow || title) && (
          <div className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <h2 className="text-h2">{title}</h2>}
          </div>
        )}
        <div className="sol-grid">
          <SolCard card={tallCard} tall delay={0} />
          {stackCards.length > 0 && (
            <div className="sol-col">
              {stackCards.map((card, i) => (
                <SolCard
                  key={card.id ?? card.title}
                  card={card}
                  tall={false}
                  delay={0.12 * (i + 1)}
                />
              ))}
            </div>
          )}
        </div>
      </Container>
    </Section>
  )
}
