import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { GradientText } from '@/components/ui/GradientText'
import { Section } from '@/components/ui/Section'
import { Counter } from '@/motion/Counter'
import { Stagger } from '@/motion/reveal'
import type { StatsBlock as StatsBlockType } from '@/payload-types'

/**
 * Fiel a `.stats-grid` de `_reference/index.html`: números em gradiente
 * (`GradientText variant="brand"` = `.gx`, igual ao ref) animados via
 * `Counter`, cada item com borda esquerda, dentro de `Stagger`. Seção clara
 * (`sec-light`), como no ref (`.stats.sec-light`). Header de seção opcional
 * (`eyebrow`/`title`), fiel ao `.sec-head` do ref (mesmo padrão do
 * `FeatureGridBlock`). Itens aceitam `prefix` (ex.: "+" em 700/70mil/100,
 * `_reference/index.html:521-533`), renderizado antes do `Counter` animado.
 */
export function StatsBlock({ eyebrow, title, items }: StatsBlockType) {
  if (!items || items.length === 0) return null

  return (
    <Section light>
      <Container>
        {(eyebrow || title) && (
          <div className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <h2 className="text-h2">{title}</h2>}
          </div>
        )}
        <Stagger className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id ?? item.label}
              className="border-l border-line px-[1.6rem] pt-[0.6rem]"
            >
              <div className="text-[clamp(3.2rem,6.6vw,6rem)] leading-none">
                <GradientText variant="brand">
                  {item.prefix}
                  <Counter value={item.value} />
                  {item.suffix}
                </GradientText>
              </div>
              <p className="mt-[0.9rem] text-[0.82rem] font-semibold uppercase tracking-[0.12em] text-fg-3">
                {item.label}
              </p>
            </div>
          ))}
        </Stagger>
      </Container>
    </Section>
  )
}
