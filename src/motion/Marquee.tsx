'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'

/**
 * Faixa infinita horizontal (fiel a `.marquee`/`.marquee-track`/`@keyframes
 * marquee` de theme.css). O loop é `translateX(-50%)`: a track tem DUAS metades
 * idênticas e desloca exatamente uma metade por ciclo, então o reset é
 * invisível (sem emenda).
 *
 * **Por que é client component (era estático):** para não deixar VÃO, cada
 * metade precisa ser pelo menos tão larga quanto o container — senão, no
 * deslocamento máximo (`-50%`), sobra espaço vazio à direita (bug medido:
 * frase de 680px numa faixa de 1769px → vão de ~1089px). Como a frase é curta e
 * o container é a largura da tela (varia), medimos a largura de um conjunto de
 * `items` e repetimos (`reps`) o suficiente para cobrir o container, com folga,
 * refazendo no resize e após o carregamento das fontes (que muda a largura do
 * texto). A duração da animação é proporcional à distância percorrida, para a
 * VELOCIDADE ficar constante (`SPEED`) em qualquer largura — sem isso, telas
 * largas (mais `reps`) correriam rápido demais.
 *
 * Roda sempre, mesmo sob reduced-motion: "marquee roda sempre, é parte da
 * identidade da página" (semog.css:435). Conteúdo decorativo/duplicado → a
 * faixa inteira é `aria-hidden`.
 */

/** Velocidade da faixa em px/s — constante, independe da largura da tela (≈ o ritmo do desktop atual). */
const SPEED = 34

export function Marquee({
  items,
  className,
}: {
  items: ReactNode[] | string[]
  className?: string
}) {
  const marqueeRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const unitRef = useRef<HTMLSpanElement>(null)
  // `reps` = cópias do conjunto de `items` em CADA metade da track. Default 4 já
  // no SSR cobre telas comuns antes da medição (evita um flash de vão na carga).
  const [reps, setReps] = useState(4)

  useEffect(() => {
    const marquee = marqueeRef.current
    const track = trackRef.current
    if (!marquee || !track) return

    const compute = () => {
      const unitW = unitRef.current?.getBoundingClientRect().width ?? 0
      if (!unitW) return
      const setW = unitW * items.length
      // cada metade (= reps conjuntos) precisa cobrir o container, +1 de folga;
      // mín. 2 para o loop existir.
      const nextReps = Math.max(2, Math.ceil(marquee.offsetWidth / setW) + 1)
      setReps(nextReps)
      // distância por ciclo = 1 metade = reps*setW; duração = distância/velocidade.
      track.style.animationDuration = `${(nextReps * setW) / SPEED}s`
    }

    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(marquee)
    // a largura do texto muda quando a fonte real (Clash) troca a fallback.
    document.fonts?.ready.then(compute).catch(() => {})
    return () => ro.disconnect()
  }, [items])

  // uma metade = `reps` cópias de `items`; a track são DUAS metades (duplicado)
  // para o `translateX(-50%)` fechar sem emenda.
  const half = Array.from({ length: reps }, () => items).flat()
  const track = [...half, ...half]

  return (
    <div
      ref={marqueeRef}
      className={className ? `marquee ${className}` : 'marquee'}
      aria-hidden="true"
    >
      <div ref={trackRef} className="marquee-track">
        {track.map((item, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: itens estáticos e duplicados, sem reordenação
          <span key={i} ref={i === 0 ? unitRef : undefined}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
