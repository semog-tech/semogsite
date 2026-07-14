import { ImageMedia } from '@/components/Media/ImageMedia'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/motion/reveal'
import { TimelinePinned } from '@/motion/TimelinePinned'
import type { Media, TimelineBlock as TimelineBlockType } from '@/payload-types'

type Item = NonNullable<TimelineBlockType['items']>[number]

/** Um `.tl-item`. Fiel a `_reference/semog.html:286-325`. */
function TlCard({ item }: { item: Item }) {
  const image = item.image && typeof item.image === 'object' ? (item.image as Media) : undefined

  return (
    <article className={`tl-item${item.now ? ' now' : ''}`}>
      {image && (
        <div className="relative mb-1 aspect-video overflow-hidden rounded-card">
          <ImageMedia resource={image} fill sizes="400px" className="object-cover" />
        </div>
      )}
      <span className="year">{item.date}</span>
      <h3>{item.title}</h3>
      <p>{item.text}</p>
    </article>
  )
}

/**
 * Fiel a `#historia` de `_reference/semog.html:275-328`: cabeçalho
 * (`.sec-head`, `data-reveal`) dentro do wrap pinado + 8 cartões datados
 * deslizando na horizontal (`TimelinePinned`, `src/motion/TimelinePinned.tsx`
 * — pin + scrub GSAP fiel ao script inline `:465-497`).
 */
export function TimelineBlock({ eyebrow, title, text, items }: TimelineBlockType) {
  if (!items || items.length === 0) return null

  return (
    <TimelinePinned
      className="timeline-wrap"
      head={
        (eyebrow || title || text) && (
          <Container className="timeline-head">
            <Reveal className="mb-[clamp(1.5rem,3vh,3rem)] max-w-2xl">
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              {title && <h2 className="text-h2">{title}</h2>}
              {text && <p className="max-w-[58ch] text-lead text-fg-2">{text}</p>}
            </Reveal>
          </Container>
        )
      }
    >
      {items.map((item) => (
        <TlCard key={item.id ?? item.date} item={item} />
      ))}
    </TimelinePinned>
  )
}
