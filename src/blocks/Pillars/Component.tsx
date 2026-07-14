import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/motion/reveal'
import type { PillarsBlock as PillarsBlockType } from '@/payload-types'

/**
 * Fiel à `.pillars` de `_reference/index.html:558-573`: cada pilar é uma
 * `.pillar-row` (grid título/texto) que entra via `Reveal` (`data-reveal`,
 * semog.js:122-136) e reage ao hover (padding-left/cor/glyph) pelo CSS
 * `.pillar-row` em theme.css. `!pt-0` reproduz `.pillars { padding-top: 0 }`
 * do ref (a seção cola no manifesto anterior); o padding-bottom vem da
 * `Section`. O `glyph`, quando presente, fica à esquerda do título.
 */
export function PillarsBlock({ items }: PillarsBlockType) {
  if (!items || items.length === 0) return null

  return (
    <Section className="!pt-0">
      <Container>
        {items.map((item) => (
          <Reveal key={item.id ?? item.title} className="pillar-row">
            {item.glyph ? (
              <div className="flex items-center gap-4">
                <div className="glyph">{item.glyph}</div>
                <h3>{item.title}</h3>
              </div>
            ) : (
              <h3>{item.title}</h3>
            )}
            <p>{item.text}</p>
          </Reveal>
        ))}
      </Container>
    </Section>
  )
}
