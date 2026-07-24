import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Reveal, Stagger } from '@/motion/reveal'
import type { PillarsBlock as PillarsBlockType } from '@/payload-types'

/**
 * Fiel à `.pillars` de `_reference/index.html:558-573`: cada pilar é uma
 * `.pillar-row` (grid título/texto) que entra via `Reveal` (`data-reveal`,
 * semog.js:122-136) e reage ao hover (padding-left/cor/glyph) pelo CSS
 * `.pillar-row` em theme.css. `tightTop` (default `true`) reproduz
 * `.pillars { padding-top: 0 }` do ref (a seção cola na anterior); o
 * padding-bottom vem sempre da `Section`. O `glyph`, quando presente, fica à
 * esquerda do título. `eyebrow`, quando presente, entra via `Reveal` acima
 * das rows (ver doc do campo em `Pillars/config.ts`). `light`/`white` ligam
 * `.sec-light`/`.sec-light.white` na `Section`; `compact` soma a classe
 * `compact` em cada `.pillar-row` (tipografia menor, fiel a `.g-step`).
 *
 * `variant: 'columns'` troca a lista de `.pillar-row` (linha inteira, hover)
 * por uma grade `.pillars-columns` (auto-fit, ver theme.css) — usada pela
 * Home (3 itens) e futuramente por `/aplicativo` (2 itens, síndico e
 * administradora). `header` (eyebrow) é o mesmo elemento nos dois branches:
 * extraído aqui pra não duplicar o JSX entre `rows` e `columns`.
 */
export function PillarsBlock({
  eyebrow,
  tightTop,
  light,
  white,
  compact,
  variant,
  items,
}: PillarsBlockType) {
  if (!items || items.length === 0) return null

  const header = eyebrow && (
    <Reveal className="mb-[clamp(2.5rem,5vw,4rem)]">
      <Eyebrow className="mb-0">{eyebrow}</Eyebrow>
    </Reveal>
  )

  if (variant === 'columns') {
    return (
      <Section light={!!light} white={!!white} className={tightTop === false ? '' : '!pt-0'}>
        <Container>
          {header}
          <Stagger className="pillars-columns">
            {items.map((item) => (
              <div key={item.id ?? item.title} className="pillar-col">
                {item.glyph && <span className="pillar-col-glyph">{item.glyph}</span>}
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </Stagger>
        </Container>
      </Section>
    )
  }

  return (
    <Section light={!!light} white={!!white} className={tightTop === false ? '' : '!pt-0'}>
      <Container>
        {header}
        {items.map((item) => (
          <Reveal
            key={item.id ?? item.title}
            className={compact ? 'pillar-row compact' : 'pillar-row'}
          >
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
