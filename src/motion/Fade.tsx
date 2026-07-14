'use client'
import { type ElementType, type ReactNode, type Ref, useEffect, useRef } from 'react'

/**
 * Fiel a semog.js:88-93 (`[data-fade]`). Roda sempre, mesmo sob
 * reduced-motion — fade com atraso é motion essencial do hero, não efeito
 * pesado (semog.js:11-15). `delay`/`duration` equivalem aos atributos
 * `data-fade-delay`/`data-fade-duration` do original.
 */
export function Fade({
  children,
  delay = 0,
  duration,
  as: Tag = 'div',
  className,
}: {
  children: ReactNode
  delay?: number
  duration?: number
  as?: ElementType
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (duration) el.style.transitionDuration = `${duration}ms`
    const t = setTimeout(() => {
      el.classList.add('is-in')
    }, delay)
    return () => clearTimeout(t)
  }, [delay, duration])

  return (
    <Tag ref={ref as Ref<HTMLElement>} data-fade className={className}>
      {children}
    </Tag>
  )
}
