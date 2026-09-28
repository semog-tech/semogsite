'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * Preloader (três barras do logo) — fiel ao script de dismiss de
 * `_reference/index.html` e a semog.css:532-549. Como o hero-video não é
 * garantido em toda página, sai adicionando `.is-done` no `load` da janela OU
 * após 2.2s (o que vier primeiro) e se remove do DOM ao fim da transição. Sob
 * prefers-reduced-motion sai de imediato (semog.css:550 usava `.reduced-motion`,
 * ausente neste app — resolvido aqui via matchMedia). SSR-safe: o acesso ao DOM
 * fica no efeito.
 *
 * Este caminho só ANTECIPA a saída: o teto de verdade é a animação
 * `preloader-cap` (src/styles/theme.css), que conta a partir da primeira
 * pintura e não depende de bundle, hidratação nem de o JavaScript existir. Por
 * isso os 2.2s aqui não são rede de segurança — eles só começam a contar
 * depois de hidratar, e num 3G isso chegava a 21s de tela travada.
 */
export function Preloader() {
  const [done, setDone] = useState(false)
  const [removed, setRemoved] = useState(false)
  const overlay = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRemoved(true)
      return
    }

    let finished = false
    let removeTimer: number | undefined
    const sair = () => setRemoved(true)
    const finish = () => {
      if (finished) return
      finished = true
      // Se o teto CSS já começou a apagar o overlay, `.is-done` chegando agora
      // cancelaria `preloader-cap` no meio e cortaria o fade em seco (medido:
      // queda de 0.85 num frame). Nesse caso o React só espera o CSS terminar
      // — ou sai na hora, se a animação nem existir (folha de estilo fora do
      // ar) ou for cancelada, porque aí nada mais vai esconder o nó.
      const el = overlay.current
      if (el !== null && Number.parseFloat(getComputedStyle(el).opacity) < 1) {
        const [tetoCss] = el.getAnimations()
        if (tetoCss === undefined) sair()
        else tetoCss.finished.then(sair, sair)
        return
      }
      setDone(true)
      removeTimer = window.setTimeout(sair, 800)
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
    <div className={done ? 'preloader is-done' : 'preloader'} aria-hidden="true" ref={overlay}>
      <div className="bars">
        <i />
        <i />
        <i />
      </div>
    </div>
  )
}
