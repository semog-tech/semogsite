import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { GradientText } from '@/components/ui/GradientText'
import { Section } from '@/components/ui/Section'
import { Counter } from '@/motion/Counter'
import { Stagger } from '@/motion/reveal'
import type { StatsBlock as StatsBlockType } from '@/payload-types'

type StatItem = NonNullable<StatsBlockType['items']>[number]

/** Número em gradiente (`GradientText variant="brand"` = `.gx`) animado via `Counter`. */
function StatValue({ item, className }: { item: StatItem; className: string }) {
  return (
    <div className={`${className} whitespace-nowrap`}>
      <GradientText variant="brand">
        {item.prefix}
        <Counter value={item.value} />
        {item.suffix}
      </GradientText>
    </div>
  )
}

/**
 * Fiel a `.stats-grid` de `_reference/index.html`: números em gradiente
 * (`GradientText variant="brand"` = `.gx`) animados via `Counter`, dentro de
 * `Stagger`. Seção clara (`sec-light`). Header opcional (`eyebrow`/`title`,
 * fiel ao `.sec-head`). Itens aceitam `prefix`/`suffix` e — no ledger —
 * `detail`.
 *
 * Dois layouts, via `variant`:
 *
 * - **`grid`** (padrão): a grade fiel ao ref (usada em /semog e nas landings
 *   de cidade como `.mini-stats`). Cada item é container query (`@container`)
 *   e a fonte usa `cqi` (`clamp(2.1rem,22cqi,4.5rem)`) — escala com a largura
 *   da coluna, nunca estoura (`grid-cols-2` → `sm:grid-cols-3` →
 *   `xl:grid-cols-5`). Inalterado.
 *
 * - **`feature`** (home): **ledger editorial**. Cada item é uma linha própria:
 *   número grande em Clash (`var(--font-display)`) alinhado à direita num
 *   eixo comum (coluna `auto` + `min-width`, por isso os números nunca
 *   estouram e as réguas alinham), rótulo em azul da marca (`navy-500`) e uma
 *   frase de apoio (`detail`) — separados por réguas finas (`border-line`).
 *   Resolve o "5 colunas estreitas deixavam os números pequenos" com muito
 *   mais impacto e significado que a grade.
 */
export function StatsBlock({ eyebrow, title, items, variant }: StatsBlockType) {
  if (!items || items.length === 0) return null

  const header = (eyebrow || title) && (
    <div className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      {title && <h2 className="text-h2">{title}</h2>}
    </div>
  )

  if (variant === 'feature') {
    return (
      <Section light>
        <Container>
          {header}
          <Stagger className="border-t border-line">
            {items.map((item) => (
              <div
                key={item.id ?? item.label}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-[clamp(1.5rem,5vw,4.5rem)] border-b border-line py-[clamp(1.4rem,2.8vw,2.1rem)]"
              >
                <StatValue
                  item={item}
                  className="min-w-[min(42vw,15rem)] text-right font-[family-name:var(--font-display)] font-semibold leading-[0.85] tracking-[-0.01em] text-[length:clamp(2.6rem,5vw,4.8rem)]"
                />
                <div>
                  <div className="text-[0.85rem] font-bold uppercase tracking-[0.12em] text-navy-500">
                    {item.label}
                  </div>
                  {item.detail && (
                    <p className="mb-0 mt-[0.4rem] text-[length:clamp(1rem,1.5vw,1.18rem)] font-medium text-fg-3">
                      {item.detail}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </Stagger>
        </Container>
      </Section>
    )
  }

  return (
    <Section light>
      <Container>
        {header}
        <Stagger className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 xl:grid-cols-5">
          {items.map((item) => (
            <div
              key={item.id ?? item.label}
              className="@container border-l border-line px-[1.6rem] pt-[0.6rem]"
            >
              <StatValue item={item} className="text-[length:clamp(2.1rem,22cqi,4.5rem)] leading-none" />
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
