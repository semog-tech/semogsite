import type { ReactNode } from 'react'

/**
 * Fiel a semog.css:331-337 (.eyebrow/.eyebrow::before). O tracinho de 28x1px
 * do `::before` é reproduzido como `<span aria-hidden>` porque Tailwind não
 * gera `content` de pseudo-elemento via utilitárias.
 */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 mb-[1.2rem] text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-ice-500 ${className}`}
    >
      <span aria-hidden="true" className="h-px w-7 bg-ice-500" />
      {children}
    </span>
  )
}
