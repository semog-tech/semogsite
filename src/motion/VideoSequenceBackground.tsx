'use client'

import { useEffect, useRef } from 'react'

const FADE_MS = 1400

type Props = {
  videos: string[]
  className?: string
}

/**
 * Fundo de vídeo em sequência com crossfade, para o hero (Hero
 * `background: 'videoSequence'`). Duas camadas `<video>` empilhadas fazem
 * ping-pong: enquanto uma toca, a outra pré-carrega o próximo clipe; ao se
 * aproximar do fim do clipe atual, um crossfade de opacidade troca as
 * camadas. Cicla os N vídeos em loop infinito (…→3→0→1→…).
 *
 * Anima SEMPRE — muted/autoplay/playsInline, inclusive sob
 * `prefers-reduced-motion` — mesma decisão do `GradientBackground`: o
 * movimento do hero faz parte da identidade e é pedido explícito do dono do
 * site. Todos os clipes são mudos (sem faixa de áudio), então o autoplay é
 * permitido pelos navegadores. `object-cover` cobre o hero em qualquer
 * proporção (os clipes são retrato 3:4 — enquadram cheio no mobile e
 * recortam o miolo no desktop largo).
 */
export function VideoSequenceBackground({ videos, className }: Props) {
  const aRef = useRef<HTMLVideoElement>(null)
  const bRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const a = aRef.current
    const b = bRef.current
    if (!a || !b || videos.length === 0) return

    const layers = [a, b] as const
    let active = 0 // camada visível: 0 = a, 1 = b
    let nextPointer = videos.length > 1 ? 1 : 0 // índice do clipe na camada oculta
    let fading = false
    let raf = 0
    let swapTimer = 0

    for (const v of layers) {
      v.muted = true
    }
    a.src = videos[0]
    b.src = videos[nextPointer]
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
      if (!fading && cur.duration && cur.currentTime >= cur.duration - FADE_S) {
        // Invariante: `other` já está pré-carregada com videos[nextPointer].
        fading = true
        other.currentTime = 0
        other.play().catch(() => {})
        cur.style.transition = `opacity ${FADE_MS}ms linear`
        other.style.transition = `opacity ${FADE_MS}ms linear`
        cur.style.opacity = '0'
        other.style.opacity = '1'
        swapTimer = window.setTimeout(() => {
          active ^= 1
          nextPointer = (nextPointer + 1) % videos.length
          const hidden = layers[active ^ 1]
          hidden.src = videos[nextPointer]
          hidden.load()
          fading = false
        }, FADE_MS)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(swapTimer)
    }
  }, [videos])

  return (
    <div className={className} aria-hidden="true">
      <video
        ref={aRef}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 1 }}
      />
      <video
        ref={bRef}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 0 }}
      />
    </div>
  )
}
