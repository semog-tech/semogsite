'use client'

import './comunidade-video.css'
import { useEffect, useRef, useState } from 'react'
import type { VideoDoExperience } from '@/site/conteudo/conteudo'

/** Quanto antes de chegar à tela o vídeo começa a carregar: uma tela inteira abaixo da dobra. */
const ANTECEDENCIA = '0px 0px 100% 0px'

/**
 * O reel do Experience 26 no retrato da Comunidade. O arquivo tem 19,9 MB: o `src` só entra quando
 * o quadro se aproxima da tela, e até lá (e sem JavaScript) fica a capa. Com o `src`, toca mudo e
 * em laço, como o `autoplay` do protótipo.
 */
export function VideoQuandoPerto({ video }: { video: VideoDoExperience }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [perto, setPerto] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || perto) return
    // Sem IntersectionObserver (navegador muito antigo), carrega já: o vídeo não pode sumir.
    if (typeof IntersectionObserver === 'undefined') {
      setPerto(true)
      return
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((entrada) => entrada.isIntersecting)) setPerto(true)
      },
      { rootMargin: ANTECEDENCIA },
    )
    observador.observe(el)
    return () => observador.disconnect()
  }, [perto])

  return (
    <video
      ref={ref}
      src={perto ? video.src : undefined}
      poster={video.poster}
      width={video.largura}
      height={video.altura}
      muted
      loop
      playsInline
      autoPlay
      preload="metadata"
      aria-label={video.legenda}
    />
  )
}
