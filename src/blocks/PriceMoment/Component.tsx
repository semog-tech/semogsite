import { Container } from '@/components/ui/Container'
import { Reveal } from '@/motion/reveal'
import type { PriceMomentBlock as PriceMomentBlockType } from '@/payload-types'

/**
 * Fiel a `.g-one` de `_reference/garante.html:335-342` (markup) +
 * `:143-165` (estilo inline da própria página): `<section>` puro (não
 * `Section`, que força um `padding-block` genérico diferente do clamp maior
 * do ref — mesmo motivo do `WordsSection`/`CTABand` `variant:'centered'`).
 * `.huge` entra com `Reveal dir="scale"` (`data-reveal="scale"`, semog.js:
 * 122-136); `.sub`/`.fine` com `Reveal` padrão, escalonado.
 */
export function PriceMomentBlock({ value, sub, fine }: PriceMomentBlockType) {
  if (!value) return null

  return (
    <section className="g-one" aria-label="Preço">
      <Container>
        <Reveal as="span" dir="scale" className="huge">
          {value}
        </Reveal>
        {sub && (
          <Reveal as="p" className="sub">
            {sub}
          </Reveal>
        )}
        {fine && (
          <Reveal as="p" delay={0.1} className="fine">
            {fine}
          </Reveal>
        )}
      </Container>
    </section>
  )
}
