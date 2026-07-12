import type { ReactNode } from 'react'

/**
 * Fiel a semog.css:195 (`section { padding-block: var(--section); position:
 * relative; }`, onde `--section: clamp(5rem,10vw,9rem)`) e :129-138
 * (.sec-light/.sec-light.white, portadas para src/styles/theme.css
 * @layer base na Task 1). `white` só tem efeito quando `light` também está
 * ativo — no ref, `.white` sozinho não corresponde a nenhuma regra.
 */
export function Section({
  children,
  light,
  white,
  className = '',
}: {
  children: ReactNode
  light?: boolean
  white?: boolean
  className?: string
}) {
  const cls = [
    'relative py-[clamp(5rem,10vw,9rem)]',
    light && (white ? 'sec-light white' : 'sec-light'),
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return <section className={cls}>{children}</section>
}
