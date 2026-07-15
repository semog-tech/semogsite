import type { CSSProperties, ReactNode } from 'react'

/**
 * Fiel a semog.css:195 (`section { padding-block: var(--section); position:
 * relative; }`, onde `--section: clamp(5rem,10vw,9rem)`) e :129-138
 * (.sec-light/.sec-light.white, portadas para src/styles/theme.css
 * @layer base na Task 1). `white` só tem efeito quando `light` também está
 * ativo — no ref, `.white` sozinho não corresponde a nenhuma regra. `style`
 * é um escape hatch para valores numéricos vindos do CMS que não dá pra
 * expressar como classe Tailwind estática (ex.: os campos `pageHero*` do
 * `Hero`, que variam por página).
 */
export function Section({
  children,
  light,
  white,
  className = '',
  style,
  ariaLabel,
}: {
  children: ReactNode
  light?: boolean
  white?: boolean
  className?: string
  style?: CSSProperties
  /** `aria-label` do `<section>` — ex.: `.quick`/`.selfserve` de `_reference/contato.html:208,234`. */
  ariaLabel?: string
}) {
  const cls = [
    'relative py-[clamp(5rem,10vw,9rem)]',
    light && (white ? 'sec-light white' : 'sec-light'),
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <section className={cls} style={style} aria-label={ariaLabel}>
      {children}
    </section>
  )
}
