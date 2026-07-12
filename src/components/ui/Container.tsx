import type { ReactNode } from 'react'

/**
 * Fiel a semog.css:188-193 (.container). `max-w-site` vem do token
 * `--container-site` (Task 1 @theme); o gutter fluido é reproduzido como
 * padding-inline arbitrário, idêntico ao `--gutter: clamp(1.25rem,4vw,3rem)`
 * do ref (semog.css:60).
 */
export function Container({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto w-full max-w-site px-[clamp(1.25rem,4vw,3rem)] ${className}`}>
      {children}
    </div>
  )
}
