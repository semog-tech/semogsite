'use client'
import { type ElementType, type Ref, useEffect, useRef } from 'react'
import { gsap } from './gsap'
import { useReducedHeavy } from './useReducedHeavy'

/**
 * Fiel a semog.js:178-197 ([data-words]). Roda sempre — só troca de
 * comportamento: scrub palavra-a-palavra no modo normal, ou revelação em
 * bloco (once) sob reduced-motion, que desativa apenas o scrub pesado.
 */
export function Words({
  children,
  as: Tag = 'p',
  className,
}: {
  children: string
  as?: ElementType
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const reduceHeavy = useReducedHeavy()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const text = children.trim()
    el.setAttribute('aria-label', text)
    el.innerHTML = text
      .split(/\s+/)
      .map((w) => `<span class="wd" aria-hidden="true" style="opacity:0.14;">${w}</span>`)
      .join(' ')
    const words = el.querySelectorAll('.wd')

    const tween = reduceHeavy
      ? gsap.to(words, {
          opacity: 1,
          duration: 0.8,
          stagger: 0.02,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 80%', once: true },
        })
      : gsap.to(words, {
          opacity: 1,
          stagger: 0.06,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 82%', end: 'top 30%', scrub: 0.6 },
        })

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [children, reduceHeavy])

  return (
    <Tag ref={ref as Ref<HTMLElement>} className={className}>
      {children}
    </Tag>
  )
}
