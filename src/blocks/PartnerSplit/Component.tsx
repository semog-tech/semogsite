import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/motion/reveal'
import type { PartnerSplitBlock as PartnerSplitBlockType } from '@/payload-types'

/** Reproduz o `<strong style="color:var(--navy-500);">` inline do ref. */
function HighlightedText({ text, highlight }: { text: string; highlight?: string | null }) {
  if (!highlight || !text.includes(highlight)) return <>{text}</>
  const idx = text.indexOf(highlight)
  return (
    <>
      {text.slice(0, idx)}
      <strong className="text-navy-500">{highlight}</strong>
      {text.slice(idx + highlight.length)}
    </>
  )
}

/**
 * Fiel a `.g-partner sec-light` de `_reference/garante.html:376-392`:
 * `.wrap` de 2 colunas (h2 esquerda, texto direita), cada uma com `Reveal`
 * direcional (`dir="left"`/`dir="right"`, `data-reveal="left"`/`"right"`).
 * `Section light` (bg `#F2F4F9`, sem `.white`).
 */
export function PartnerSplitBlock({ title, text, highlight }: PartnerSplitBlockType) {
  if (!title || !text) return null

  return (
    <Section light className="g-partner">
      <Container>
        <div className="wrap">
          <Reveal dir="left">
            <h2>{title}</h2>
          </Reveal>
          <Reveal as="p" dir="right">
            <HighlightedText text={text} highlight={highlight} />
          </Reveal>
        </div>
      </Container>
    </Section>
  )
}
