'use client'
import { type ElementType, type Ref, useEffect, useRef } from 'react'
import { gsap } from './gsap'

/**
 * Fiel a semog.js:214-224 ([data-split]). Roda sempre — a headline é a
 * demo de motion do site, não um efeito pesado desativável.
 */
export function SplitHeadline({
  children,
  as: Tag = 'h1',
  className,
}: {
  children: string
  as?: ElementType
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const words = children.trim().split(/\s+/)
    el.setAttribute('aria-label', children.trim())
    el.innerHTML = words
      .map(
        (w) =>
          `<span class="split-w" aria-hidden="true" style="display:inline-block;overflow:hidden;vertical-align:top;"><span style="display:inline-block;">${w}</span></span>`,
      )
      .join(' ')
    const inners = el.querySelectorAll('.split-w > span')
    const tween = gsap.fromTo(
      inners,
      { yPercent: 110 },
      { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07, delay: 0.15 },
    )
    return () => {
      tween.kill()
    }
  }, [children])
  return (
    <Tag ref={ref as Ref<HTMLElement>} className={className}>
      {children}
    </Tag>
  )
}
