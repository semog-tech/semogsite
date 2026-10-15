import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type Lenis from 'lenis'

/* Posição da página em volta da montagem das cenas (portado de core/posicao.js do protótipo).
   Com a página JÁ ROLADA no momento em que as cenas criam os gatilhos (recarga no meio,
   restauração de rolagem, âncora no endereço), um gatilho `once` que ficou para trás dispara e
   se mata no meio do refresh, e o GSAP lê `.end` de um índice que sumiu. Por isso: a página vai
   ao topo antes das cenas, um refresh global mede tudo, e só então ela volta para onde estava
   ou para a âncora. Tudo na mesma tarefa: não chega a pintar o topo. */

function decodificar(id: string): string {
  try {
    return decodeURIComponent(id)
  } catch {
    // Hash malformado (% solto): usa como veio; getElementById só não acha.
    return id
  }
}

/** Elemento da âncora do endereço (#unidades), se existir. */
export function alvoDaAncora(hash: string = location.hash): HTMLElement | null {
  if (hash.length < 2) return null
  const alvo = document.getElementById(decodificar(hash.slice(1)))
  return alvo instanceof HTMLElement ? alvo : null
}

/** Rola sem animação para um y ou um elemento (descontando o scroll-padding-top do <html>). */
function rolarAgora(lenis: Lenis | null, destino: number | HTMLElement): void {
  if (lenis) {
    // O Lenis guarda o limite de rolagem da última medida; os pins acabaram de aumentar a página.
    lenis.resize()
    lenis.scrollTo(destino, { immediate: true, force: true })
  } else {
    let y = typeof destino === 'number' ? destino : 0
    if (destino instanceof HTMLElement) {
      const folga = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)
      y = destino.getBoundingClientRect().top + window.scrollY - (folga || 0)
    }
    window.scrollTo(0, y)
  }
  ScrollTrigger.update()
}

/** Leva a página ao topo antes de as cenas criarem os gatilhos; devolve o y em que estava. */
export function irAoTopoParaMontar(lenis: Lenis | null): number {
  const y = window.scrollY
  if (y > 0) rolarAgora(lenis, 0)
  return y
}

/** Depois que TODAS as cenas criaram os gatilhos: refresh global e volta à âncora ou ao y. */
export function assentarPosicao(lenis: Lenis | null, y: number): void {
  ScrollTrigger.refresh(true)
  const ancora = alvoDaAncora()
  if (ancora) rolarAgora(lenis, ancora)
  else if (y > 0) rolarAgora(lenis, y)
}

const EVENTOS_DE_PESSOA = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const

/** Sabe se a pessoa já mexeu na página (roda, toque, tecla, clique). */
export function vigiarPrimeiraInteracao(): { rolou: () => boolean; desligar: () => void } {
  let rolou = false
  const marcar = () => {
    rolou = true
  }
  for (const evento of EVENTOS_DE_PESSOA) {
    window.addEventListener(evento, marcar, { once: true, passive: true })
  }
  return {
    rolou: () => rolou,
    desligar: () => {
      for (const evento of EVENTOS_DE_PESSOA) window.removeEventListener(evento, marcar)
    },
  }
}

/**
 * Quando fontes e imagens chegam, os pins são recalculados e a âncora muda de lugar (o Firefox
 * ainda refaz o pulo para a âncora durante a carga). Se a pessoa não mexeu, volta à âncora.
 */
export function reancorar(lenis: Lenis | null, rolou: () => boolean): void {
  const ancora = alvoDaAncora()
  if (!ancora || rolou()) return
  rolarAgora(lenis, ancora)
}
