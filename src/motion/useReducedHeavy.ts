'use client'
import { useEffect, useState } from 'react'

/**
 * true = desativar efeitos pesados (smooth scroll, parallax, scrub).
 * Reveals, contadores, marquee e headline continuam rodando sempre.
 * Fiel a semog.js:11-15.
 */
export function useReducedHeavy(): boolean {
  const [reduce, setReduce] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduce(mq.matches)
    const onChange = () => setReduce(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduce
}
