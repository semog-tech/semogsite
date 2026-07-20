'use client'

import { useEffect, useRef } from 'react'

/**
 * Barra fina de progresso de leitura no topo da página do artigo
 * (`/blog/[slug]`). Escreve a fração lida direto no `transform: scaleX(...)`
 * do elemento via `ref` (sem `useState`) para não re-renderizar o React a cada
 * evento de scroll — o listener é `passive` e a atualização é puramente
 * visual. `aria-hidden`: é decorativo, não anuncia progresso para leitores de
 * tela. Estilos em `.article-progress*` (`src/styles/theme.css`).
 */
export function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const update = () => {
      const el = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      const ratio = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0
      if (barRef.current) barRef.current.style.transform = `scaleX(${ratio})`
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div className="article-progress" aria-hidden="true">
      <div ref={barRef} className="article-progress__bar" />
    </div>
  )
}
