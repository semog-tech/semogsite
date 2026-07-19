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
    <div className={`${className} whitespace-nowrap leading-[0.9]`}>
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
 * (`GradientText variant="brand"` = `.gx`, igual ao ref) animados via
 * `Counter`, dentro de `Stagger`. Seção clara (`sec-light`). Header opcional
 * (`eyebrow`/`title`, fiel ao `.sec-head`). Itens aceitam `prefix`/`suffix`.
 *
 * Dois layouts, via `variant`:
 *
 * - **`grid`** (padrão): a grade fiel ao ref (usada em /semog e nas landings
 *   de cidade como `.mini-stats`). Cada item é um container query (`@container`)
 *   e a fonte usa `cqi` (`clamp(2.1rem,22cqi,4.5rem)`) — escala com a largura
 *   real da coluna, nunca estoura, seja qual for o nº de colunas
 *   (`grid-cols-2` → `sm:grid-cols-3` → `xl:grid-cols-5`). O ref original usa
 *   `repeat(4,1fr)` com `font-size` fixo em vw, que com 5 itens estoura.
 *
 * - **`feature`** (home): o 1º item vira um número GIGANTE em destaque
 *   (`clamp(4rem,26cqi,8.5rem)`) e os demais entram num grid de apoio 2×2 ao
 *   lado (desktop) / abaixo (mobile), em tamanho médio — resolve o "5 é um
 *   número ruim pra grade" e dá muito mais impacto que 5 colunas estreitas
 *   (onde o `cqi` deixava os números pequenos). Tamanhos em `cqi` também, por
 *   isso nunca estouram.
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
    const [feature, ...rest] = items
    return (
      <Section light>
        <Container>
          {header}
          <Stagger className="grid gap-y-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-x-[clamp(3rem,6vw,6rem)]">
            <div className="@container">
              <StatValue item={feature} className="text-[length:clamp(4rem,26cqi,8.5rem)]" />
              <p className="mt-[1.1rem] text-[0.95rem] font-semibold uppercase tracking-[0.14em] text-fg-3">
                {feature.label}
              </p>
            </div>
            {rest.length > 0 && (
              <div className="grid grid-cols-2 gap-x-8 gap-y-[clamp(2rem,4vw,3rem)] sm:gap-x-12">
                {rest.map((item) => (
                  <div
                    key={item.id ?? item.label}
                    className="@container border-l border-line pl-[1.4rem] pt-[0.4rem]"
                  >
                    <StatValue item={item} className="text-[length:clamp(2rem,15cqi,3.6rem)]" />
                    <p className="mt-[0.7rem] text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-fg-3">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
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
              <StatValue item={item} className="text-[length:clamp(2.1rem,22cqi,4.5rem)]" />
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
