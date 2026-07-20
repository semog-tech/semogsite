import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/motion/reveal'
import type { CompareBlock as CompareBlockType } from '@/payload-types'

type Column = CompareBlockType['before']

/** Um `.cmp-col` (`after` soma a variante em grad-band + glow). */
function CompareColumn({ col, after, delay }: { col: Column; after?: boolean; delay?: number }) {
  if (!col?.tag) return null
  return (
    <Reveal delay={delay} className={after ? 'cmp-col after' : 'cmp-col'}>
      <span className="cmp-tag">{col.tag}</span>
      <ul>
        {col.items?.map((item) => (
          <li key={item.id ?? item.text}>{item.text}</li>
        ))}
      </ul>
    </Reveal>
  )
}

/**
 * Fiel a `.g-compare sec-light white` de `_reference/garante.html:345-373`:
 * `sec-head` + `.cmp-grid` de 2 `.cmp-col` (a 2ª, `.after`, é sempre "Com o
 * Garante" — fundo `--grad-band` + `--shadow-glow`, `data-reveal-delay`
 * maior que a 1ª). Seção clara (`Section light white`), sem padding-block
 * próprio no ref — usa o `Section` genérico, ao contrário de `.g-one`/
 * `.cost` (que têm clamp bespoke).
 */
export function CompareBlock({ title, before, after }: CompareBlockType) {
  return (
    <Section light white>
      <Container>
        <div className="sec-head">
          <Reveal as="h2">{title}</Reveal>
        </div>
        <div className="cmp-grid">
          <CompareColumn col={before} />
          <CompareColumn col={after} after delay={0.15} />
        </div>
      </Container>
    </Section>
  )
}
