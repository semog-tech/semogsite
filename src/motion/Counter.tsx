'use client'
import { useEffect, useRef } from 'react'
import { gsap } from './gsap'

/**
 * Fiel a semog.js:152-164 ([data-counter]). Roda sempre, mesmo sob
 * reduced-motion — contador é movimento essencial, não efeito pesado.
 */
export function Counter({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obj = { v: 0 }
    const tween = gsap.to(obj, {
      v: value,
      duration: 2.2,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onUpdate: () => {
        el.textContent = Math.round(obj.v).toLocaleString('pt-BR')
      },
    })
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [value])
  return (
    <span ref={ref} className={className}>
      0
    </span>
  )
}
