'use client'
import { useEffect, useState } from 'react'

/**
 * Preloader (três barras do logo) — fiel ao script de dismiss de
 * `_reference/index.html` e a semog.css:532-549. Como o hero-video não é
 * garantido em toda página, sai adicionando `.is-done` no `load` da janela OU
 * após 2.2s (o que vier primeiro) e se remove do DOM ao fim da transição. Sob
 * prefers-reduced-motion sai de imediato (semog.css:550 usava `.reduced-motion`,
 * ausente neste app — resolvido aqui via matchMedia). SSR-safe: o acesso ao DOM
 * fica no efeito.
 */
export function Preloader() {
  const [done, setDone] = useState(false)
  const [removed, setRemoved] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRemoved(true)
      return
    }

    let finished = false
    let removeTimer: number | undefined
    const finish = () => {
      if (finished) return
      finished = true
      setDone(true)
      removeTimer = window.setTimeout(() => setRemoved(true), 800)
    }

    if (document.readyState === 'complete') finish()
    else window.addEventListener('load', finish, { once: true })
    const cap = window.setTimeout(finish, 2200)

    return () => {
      window.removeEventListener('load', finish)
      window.clearTimeout(cap)
      window.clearTimeout(removeTimer)
    }
  }, [])

  if (removed) return null

  return (
    <div className={done ? 'preloader is-done' : 'preloader'} aria-hidden="true">
      <div className="bars">
        <i />
        <i />
        <i />
      </div>
    </div>
  )
}
