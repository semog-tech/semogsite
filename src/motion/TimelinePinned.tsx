'use client'
import { type ReactNode, useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from './gsap'
import { useReducedHeavy } from './useReducedHeavy'

/**
 * Fiel à timeline horizontal de `_reference/semog.html:275-328` + script
 * inline `:465-497` ("seção inteira — título + cartões — pinada, trilha
 * desliza no scroll"): a seção inteira (`wrap`, aqui o próprio `<section>`
 * renderizado por este primitivo) é pinada via `ScrollTrigger` enquanto o
 * scroll vertical arrasta a trilha (`.tl-track`, aqui `children`)
 * horizontalmente por `-distance` (`track.scrollWidth - innerWidth`).
 * `head` fica dentro do wrap pinado mas nunca se move — só `children`
 * (a trilha) desliza. Reusável (ex.: variante de `/incorporadoras`).
 *
 * Efeito pesado (pin + scrub): desativado sob `useReducedHeavy` — mesma
 * política de `Parallax.tsx`. Também degrada em mobile (<=860px, mesmo
 * breakpoint do ref), onde o pin atrapalha mais do que ajuda; em ambos os
 * casos cai para scroll horizontal nativo (`overflow-x:auto`) na viewport.
 * SSR-safe: toda leitura de `window`/DOM fica dentro do `useEffect`.
 */
export function TimelinePinned({
  children,
  head,
  className,
}: {
  children: ReactNode
  head?: ReactNode
  className?: string
}) {
  const wrapRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const reduceHeavy = useReducedHeavy()

  useEffect(() => {
    const wrap = wrapRef.current
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!wrap || !viewport || !track) return

    const isMobile = window.matchMedia('(max-width: 860px)').matches
    if (isMobile || reduceHeavy) {
      // Fallback fiel ao ref (semog.html:474-478): scroll horizontal nativo,
      // sem pin/scrub. `-webkit-overflow-scrolling` não tem tipo no DOM lib
      // TS — setProperty aceita qualquer nome de propriedade CSS.
      viewport.style.overflowX = 'auto'
      viewport.style.setProperty('-webkit-overflow-scrolling', 'touch')
      return () => {
        viewport.style.overflowX = ''
        viewport.style.removeProperty('-webkit-overflow-scrolling')
      }
    }

    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth)
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: wrap,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    })
    // Fiel ao ref (semog.html:496): recalcula a distância depois que
    // imagens/fontes terminam de carregar e o layout assenta.
    //
    // BUG (confirmado via instrumentação): este efeito roda depois que a
    // hidratação do React comita, o que em builds de produção/localhost
    // pode acontecer DEPOIS do evento `load` da própria janela já ter
    // disparado (medido: listener registrado ~15ms após `load`). Um
    // `window.addEventListener('load', ...)` puro nesse caso nunca dispara
    // — o refresh de segurança do ref é perdido e start/end do pin ficam
    // presos na medição de mount, sem reagir a qualquer reflow que só se
    // resolva depois (imagens sem dimensão reservada, fontes, etc.).
    // `Preloader.tsx` já resolve exatamente essa mesma corrida assim: checar
    // `document.readyState` antes de escutar. Reaplicamos o mesmo padrão
    // aqui e ainda somamos um refresh em `document.fonts.ready` (o `load`
    // sozinho não cobre troca de webfont que termine depois dele).
    const onLoad = () => ScrollTrigger.refresh()
    if (document.readyState === 'complete') {
      requestAnimationFrame(onLoad)
    } else {
      window.addEventListener('load', onLoad, { once: true })
    }
    document.fonts.ready.then(onLoad).catch(() => {})

    return () => {
      window.removeEventListener('load', onLoad)
      tween.scrollTrigger?.kill()
      tween.kill()
      gsap.set(track, { clearProps: 'transform' })
    }
  }, [reduceHeavy])

  return (
    <section ref={wrapRef} className={className}>
      {head}
      <div ref={viewportRef} className="tl-viewport">
        <div ref={trackRef} className="tl-track">
          {children}
        </div>
      </div>
    </section>
  )
}
