import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { GradientText } from '@/components/ui/GradientText'
import { Section } from '@/components/ui/Section'
import { Counter } from '@/motion/Counter'
import { Stagger } from '@/motion/reveal'
import type { StatsBlock as StatsBlockType } from '@/payload-types'
import { BrazilMap } from './BrazilMap'

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
 * - **`feature`**: **ledger editorial**. Cada item é uma linha própria: número
 *   grande em Clash (`var(--font-display)`) alinhado à direita num eixo comum
 *   (coluna `auto` + `min-width`, por isso os números nunca estouram e as
 *   réguas alinham), rótulo em azul da marca (`navy-500`) e uma frase de apoio
 *   (`detail`) — separados por réguas finas (`border-line`). Resolve o "5
 *   colunas estreitas deixavam os números pequenos" com muito mais impacto e
 *   significado que a grade.
 *
 * - **`band`** (home, a partir do redesign de jul/2026): faixa horizontal de
 *   5 colunas com divisória vertical, número em Clash sobre `--grad-brand`,
 *   rótulo em caixa alta e frase de apoio. Substituiu o `feature` na home,
 *   onde a coluna estreita à esquerda + mapa à direita deixavam metade da
 *   seção vazia. `feature` segue disponível e inalterado para quem já usa.
 */
export function StatsBlock({ eyebrow, title, items, variant }: StatsBlockType) {
  if (!items || items.length === 0) return null

  const header = (eyebrow || title) && (
    <div className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      {title && <h2 className="text-h2">{title}</h2>}
    </div>
  )

  if (variant === 'band') {
    return (
      <Section light>
        <Container>
          {header}
          <Stagger className="grid grid-cols-2 border-t border-line md:grid-cols-3 xl:grid-cols-5">
            {items.map((item) => (
              <div
                key={item.id ?? item.label}
                className="border-line px-[clamp(0.8rem,1.6vw,1.4rem)] pt-[clamp(1.4rem,2.4vw,2rem)] first:pl-0 xl:border-l xl:first:border-l-0"
              >
                <StatValue
                  item={item}
                  className="font-[family-name:var(--font-display)] font-semibold leading-none tracking-[-0.01em] text-[length:clamp(2rem,3.4vw,3.2rem)] [font-variant-numeric:tabular-nums]"
                />
                <div className="mt-[0.7rem] text-[0.72rem] font-bold uppercase tracking-[0.14em] text-navy-500">
                  {item.label}
                </div>
                {item.detail && (
                  <p className="mb-0 mt-[0.3rem] text-[0.88rem] text-fg-2">{item.detail}</p>
                )}
              </div>
            ))}
          </Stagger>
        </Container>
      </Section>
    )
  }

  if (variant === 'feature') {
    return (
      <Section light>
        <Container>
          {header}
          <div className="grid items-center gap-x-[clamp(2rem,5vw,4.5rem)] gap-y-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <Stagger className="border-t border-line">
              {items.map((item) => (
                <div
                  key={item.id ?? item.label}
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-[clamp(1.2rem,3vw,2.4rem)] border-b border-line py-[clamp(1.1rem,2.2vw,1.7rem)]"
                >
                  <StatValue
                    item={item}
                    className="min-w-[min(38vw,11rem)] text-right font-[family-name:var(--font-display)] font-semibold leading-[0.85] tracking-[-0.01em] text-[length:clamp(2.2rem,4vw,3.9rem)]"
                  />
                  <div>
                    <div className="text-[0.82rem] font-bold uppercase tracking-[0.12em] text-navy-500">
                      {item.label}
                    </div>
                    {item.detail && (
                      <p className="mb-0 mt-[0.35rem] text-[length:clamp(0.92rem,1.2vw,1.05rem)] font-medium text-fg-3">
                        {item.detail}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </Stagger>
            <div className="mx-auto w-full max-w-[26rem] lg:max-w-none">
              <BrazilMap />
            </div>
          </div>
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
              <StatValue
                item={item}
                className="text-[length:clamp(2.1rem,22cqi,4.5rem)] leading-none"
              />
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
