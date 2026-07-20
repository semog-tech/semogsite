import { Container } from '@/components/ui/Container'
import { Reveal } from '@/motion/reveal'
import { Words } from '@/motion/Words'
import type { DevQuoteBlock as DevQuoteBlockType } from '@/payload-types'

/**
 * Fiel a `.dev-quote` de `_reference/incorporadoras.html:125-136,311-317`
 * (estilo inline da própria página, CSS portado em `theme.css`): `<section>`
 * puro (não `Section`, já que `.dev-quote` não sobrescreve `padding-block` —
 * usa o `--section` genérico, replicado literal em `theme.css` porque este
 * codebase não porta a regra solta `section{padding-block:var(--section)}`
 * do ref). Blockquote via `Words` (scrub palavra-a-palavra); `cite` via
 * `Reveal`.
 */
export function DevQuoteBlock({ quote, cite }: DevQuoteBlockType) {
  if (!quote) return null

  return (
    <section className="dev-quote">
      <Container>
        <Words as="blockquote">{quote}</Words>
        {cite && <Reveal as="cite">{cite}</Reveal>}
      </Container>
    </section>
  )
}
