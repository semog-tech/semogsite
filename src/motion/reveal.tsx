'use client'
import { type ElementType, type ReactNode, type Ref, useEffect, useRef } from 'react'
import { gsap } from './gsap'

type Dir = 'up' | 'left' | 'right' | 'scale'

/**
 * Fiel a semog.js:122-136 ([data-reveal]). Roda sempre, mesmo sob
 * reduced-motion — reveals são movimento essencial, não efeito pesado.
 */
export function Reveal({
  children,
  dir = 'up',
  delay = 0,
  as: Tag = 'div',
  className,
}: {
  children: ReactNode
  dir?: Dir
  delay?: number
  as?: ElementType
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const from = { opacity: 0, y: 28, x: 0, scale: 1 }
    if (dir === 'left') {
      from.x = -36
      from.y = 0
    }
    if (dir === 'right') {
      from.x = 36
      from.y = 0
    }
    if (dir === 'scale') {
      from.scale = 0.94
      from.y = 0
    }
    const tween = gsap.fromTo(el, from, {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      duration: 1,
      delay,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    })
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [dir, delay])
  return (
    <Tag ref={ref as Ref<HTMLElement>} className={className}>
      {children}
    </Tag>
  )
}

/**
 * Fiel a semog.js:139-149 ([data-stagger]). Roda sempre, mesmo sob
 * reduced-motion — stagger de entrada é movimento essencial.
 */
export function Stagger({
  children,
  as: Tag = 'div',
  className,
}: {
  children: ReactNode
  as?: ElementType
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const tween = gsap.fromTo(
      el.children,
      { opacity: 0, y: 34 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.09,
        scrollTrigger: { trigger: el, start: 'top 86%', once: true },
      },
    )
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [])
  return (
    <Tag ref={ref as Ref<HTMLElement>} className={className}>
      {children}
    </Tag>
  )
}
