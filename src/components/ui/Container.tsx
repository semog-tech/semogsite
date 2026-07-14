import type { CSSProperties, ReactNode } from 'react'

/**
 * Fiel a semog.css:188-193 (.container). `max-w-site` vem do token
 * `--container-site` (Task 1 @theme); o gutter fluido é reproduzido como
 * padding-inline arbitrário, idêntico ao `--gutter: clamp(1.25rem,4vw,3rem)`
 * do ref (semog.css:60). `style` é o mesmo escape hatch de `Section` — usado
 * pelo `Hero` pra `padding-bottom` dinâmico do `.page-hero` (`pageHeroPaddingBottom`,
 * varia por página, não dá pra expressar como classe Tailwind estática).
 */
export function Container({
  children,
  className = '',
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      className={`mx-auto w-full max-w-site px-[clamp(1.25rem,4vw,3rem)] ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}
