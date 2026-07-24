'use client'

import { useEffect, useRef, useState } from 'react'
import {
  FADE_MS,
  nextIndex,
  PRELOAD_LEAD_S,
  sequenceFor,
  shouldFade,
  shouldPreload,
} from './videoSequence'

type Props = {
  videos: string[]
  poster?: string
  className?: string
}

/**
 * Fundo de vídeo em sequência com crossfade, para o hero (Hero
 * `background: 'videoSequence'`). Duas camadas `<video>` empilhadas fazem
 * ping-pong: enquanto uma toca, a outra recebe o próximo clipe; ao se
 * aproximar do fim do clipe atual, um crossfade de opacidade troca as
 * camadas.
 *
 * Carregamento preguiçoso: `preload="none"` nas duas camadas e `src`
 * atribuído só quando faltam `PRELOAD_LEAD_S` segundos para o clipe atual
 * acabar. Antes disso a página baixava os quatro clipes no load — 2,9 MB
 * antes de qualquer interação. O `poster` cobre a janela entre o primeiro
 * paint e o primeiro frame decodificado, que antes era preta.
 *
 * O re-download a cada volta do ciclo NÃO é resolvido aqui: era o
 * `Cache-Control: public, max-age=0, must-revalidate` que o Next.js aplica
 * por padrão a `/public`. Corrigido por header em `next.config.ts`.
 *
 * Anima SEMPRE — muted/autoplay/playsInline, inclusive sob
 * `prefers-reduced-motion`: o movimento do hero faz parte da identidade e é
 * pedido explícito do dono do site. O botão de pausa (`.hero-video-pause`)
 * dá a saída exigida pela WCAG 2.2.2 sem tirar o autoplay. Todos os clipes
 * são mudos, então o autoplay é permitido pelos navegadores.
 */
export function VideoSequenceBackground({ videos, poster, className }: Props) {
  const aRef = useRef<HTMLVideoElement>(null)
  const bRef = useRef<HTMLVideoElement>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const a = aRef.current
    const b = bRef.current
    if (!a || !b) return

    // `matchMedia` só existe no cliente; o efeito já não roda no servidor.
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const seq = sequenceFor(videos, isMobile)
    if (seq.length === 0) return

    const layers = [a, b] as const
    let active = 0 // camada visível: 0 = a, 1 = b
    let pointer = 0 // índice do clipe tocando na camada ativa
    let preloaded = false // o próximo clipe já foi atribuído à camada oculta?
    let fading = false
    let raf = 0
    let swapTimer = 0

    for (const v of layers) {
      v.muted = true
      v.preload = 'none'
    }

    a.src = seq[0]
    a.load()
    a.style.opacity = '1'
    b.style.opacity = '0'

    const startA = () => {
      a.play().catch(() => {})
    }
    if (a.readyState >= 2) startA()
    else a.addEventListener('canplay', startA, { once: true })

    const FADE_S = FADE_MS / 1000

    const tick = () => {
      const cur = layers[active]
      const other = layers[active ^ 1]

      // Com um clipe só (mobile), não há troca: o `loop` do elemento resolve.
      if (seq.length > 1) {
        if (!preloaded && shouldPreload(cur.currentTime, cur.duration, PRELOAD_LEAD_S)) {
          preloaded = true
          other.src = seq[nextIndex(pointer, seq.length)]
          other.load()
        }

        if (!fading && preloaded && shouldFade(cur.currentTime, cur.duration, FADE_S)) {
          fading = true
          other.currentTime = 0
          other.play().catch(() => {})
          cur.style.transition = `opacity ${FADE_MS}ms linear`
          other.style.transition = `opacity ${FADE_MS}ms linear`
          cur.style.opacity = '0'
          other.style.opacity = '1'
          swapTimer = window.setTimeout(() => {
            active ^= 1
            pointer = nextIndex(pointer, seq.length)
            preloaded = false
            fading = false
          }, FADE_MS)
        }
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(swapTimer)
      a.removeEventListener('canplay', startA)
    }
  }, [videos])

  return (
    <div className={className} aria-hidden="true">
      <video
        ref={aRef}
        muted
        playsInline
        loop
        preload="none"
        poster={poster}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 1 }}
      />
      <video
        ref={bRef}
        muted
        playsInline
        preload="none"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 0 }}
      />
    </div>
  )
}
