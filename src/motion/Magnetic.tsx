'use client'
import { type ElementType, type ReactNode, type Ref, useEffect, useRef } from 'react'
import { gsap } from './gsap'
import { useReducedHeavy } from './useReducedHeavy'

/**
 * Fiel a semog.js:199-211 ([data-magnetic]). Efeito pesado: só liga com
 * `pointer: fine` e fora de reduced-motion. Sob ponteiro grosso ou
 * reduced-motion, é passthrough — renderiza os filhos, sem listeners.
 */
export function Magnetic({
  children,
  as: Tag = 'div',
  className,
}: {
  children: ReactNode
  as?: ElementType
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const reduceHeavy = useReducedHeavy()

  useEffect(() => {
    const el = ref.current
    if (!el || reduceHeavy) return
    if (!window.matchMedia('(pointer: fine)').matches) return

    const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' })

    const onMouseMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - r.left - r.width / 2) * 0.25)
      yTo((e.clientY - r.top - r.height / 2) * 0.25)
    }
    const onMouseLeave = () => {
      xTo(0)
      yTo(0)
    }

    el.addEventListener('mousemove', onMouseMove)
    el.addEventListener('mouseleave', onMouseLeave)

    return () => {
      el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('mouseleave', onMouseLeave)
      gsap.killTweensOf(el)
    }
  }, [reduceHeavy])

  return (
    <Tag ref={ref as Ref<HTMLElement>} className={className}>
      {children}
    </Tag>
  )
}
