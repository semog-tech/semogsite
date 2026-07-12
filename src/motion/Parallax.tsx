'use client'
import { type ElementType, type ReactNode, type Ref, useEffect, useRef } from 'react'
import { gsap } from './gsap'
import { useReducedHeavy } from './useReducedHeavy'

/**
 * Fiel a semog.js:166-175 ([data-parallax]). Efeito pesado: só roda fora de
 * reduced-motion. O trigger do ScrollTrigger é o elemento PAI — o
 * consumidor deve envolver o `<Parallax>` num contêiner `overflow-hidden`.
 */
export function Parallax({
  children,
  amount = 8,
  as: Tag = 'div',
  className,
}: {
  children: ReactNode
  amount?: number
  as?: ElementType
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const reduceHeavy = useReducedHeavy()

  useEffect(() => {
    const el = ref.current
    if (!el || reduceHeavy) return
    const parent = el.parentElement
    if (!parent) return

    const tween = gsap.fromTo(
      el,
      { yPercent: -amount },
      {
        yPercent: amount,
        ease: 'none',
        scrollTrigger: {
          trigger: parent,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      },
    )

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
      // `fromTo` renderiza o `from` (yPercent) de imediato ao criar o tween.
      // `useReducedHeavy` começa como `false` até seu próprio efeito rodar,
      // então sob reduced-motion este efeito pode montar e desmontar antes
      // do valor real chegar — sem isso, o yPercent do `from` ficaria
      // preso no elemento indefinidamente.
      gsap.set(el, { clearProps: 'transform' })
    }
  }, [amount, reduceHeavy])

  return (
    <Tag ref={ref as Ref<HTMLElement>} className={className}>
      {children}
    </Tag>
  )
}
