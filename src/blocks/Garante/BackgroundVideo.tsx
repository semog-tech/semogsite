'use client'

import { useEffect, useRef } from 'react'

type Props = {
  src: string
  poster?: string
  className?: string
  'aria-label'?: string
}

/**
 * Vídeo de fundo da banda "Semog Garante" — decorativo, no meio da página.
 *
 * Antes era um `<video autoPlay loop>` com `src` direto: o navegador baixava o
 * arquivo inteiro em toda visita à home, antes mesmo de a seção existir na
 * tela, e o Chrome chegava a pedir o mesmo arquivo 3× num único carregamento
 * (medido em 30/07/2026). Como o clipe pesava 7,3 MB (export cru a 9,7 Mbps),
 * era o item mais caro do site inteiro — a home toda, sem ele, tem ~460 KB de
 * JS. Aqui ele carrega só quando faz sentido:
 *
 * - **`preload="none"` + `src` atribuído só quando a seção se aproxima da
 *   viewport** (`IntersectionObserver`, margem de 200px). Uma atribuição só,
 *   nunca em loop — mesmo raciocínio do hero (`VideoSequenceBackground`).
 * - **No celular, não baixa nada**: fica no `poster`. É o público que mais
 *   paga por dado (4G no Nordeste) e o que menos ganha com um vídeo de fundo
 *   atrás de um gradiente. Mesmo corte de `(max-width: 768px)` que o hero usa.
 * - **`Save-Data` respeitado**: quem pediu economia de dados fica no poster.
 *
 * Anima sempre no desktop (muted/autoplay/loop), inclusive sob
 * `prefers-reduced-motion` — mesma decisão já tomada no hero, onde o movimento
 * é pedido explícito do dono. Diferente do hero, aqui não há botão de pausa:
 * o hero cobre a WCAG 2.2.2 com o botão porque ocupa a tela inteira no primeiro
 * paint; esta é uma faixa secundária, sem texto sobre movimento.
 */
export function GaranteBackgroundVideo({ src, poster, className, ...rest }: Props) {
  const ref = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // `matchMedia`/`connection` só existem no cliente; o efeito não roda no SSR.
    if (window.matchMedia('(max-width: 768px)').matches) return
    const connection = (navigator as { connection?: { saveData?: boolean } }).connection
    if (connection?.saveData) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        // Desconecta ANTES de atribuir o `src`: garante uma única requisição
        // mesmo que o observer dispare de novo no mesmo frame.
        observer.disconnect()
        el.src = src
        el.load()
        // `play()` rejeita se a aba estiver em segundo plano — o vídeo é
        // decorativo, então engolir a rejeição é o comportamento certo.
        void el.play().catch(() => {})
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)

    return () => observer.disconnect()
  }, [src])

  return (
    <video
      ref={ref}
      poster={poster}
      preload="none"
      autoPlay
      loop
      muted
      playsInline
      className={className}
      {...rest}
    />
  )
}
