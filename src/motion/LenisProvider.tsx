'use client'
import Lenis from 'lenis'
import { type ReactNode, useEffect } from 'react'
import { ScrollTrigger } from './gsap'
import { useReducedHeavy } from './useReducedHeavy'

/**
 * Smooth scroll (Lenis) ligado ao ScrollTrigger. Efeito pesado: não
 * inicializa sob prefers-reduced-motion (semog.js:95-119).
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const reduceHeavy = useReducedHeavy()

  useEffect(() => {
    if (reduceHeavy) return

    const lenis = new Lenis({ duration: 1.15, smoothWheel: true })
    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    lenis.on('scroll', ScrollTrigger.update)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [reduceHeavy])

  return <>{children}</>
}
