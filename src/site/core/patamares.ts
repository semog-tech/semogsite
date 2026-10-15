import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Idempotente e seguro no SSR: o GSAP só inicia o plugin quando existe `window`.
gsap.registerPlugin(ScrollTrigger)

/**
 * Snap direcional nos patamares de leitura das cenas presas, só em aparelho só de toque
 * (spec 3.2). No dedo, o arrasto tem inércia nativa e atravessa os patamares; a roda do mouse
 * anda em passos e não precisa. Portado de core/util.js do protótipo, onde foi medido com
 * scripts/toque-flicks.mjs.
 */

/** "(hover: none), (pointer: coarse)". Notebook com tela de toque e mouse dá 2 e fica de fora. */
export function soToque(): boolean {
  return ScrollTrigger.isTouch === 1
}

/** Pausa menor que esta fração da timeline não é patamar de leitura (é respiro de cascata). */
const PAUSA_MINIMA = 0.01
/** Opções de tween que não animam nada: um `.to({}, { duration })` só ocupa tempo. */
const CHAVES_DE_CONTROLE = new Set([
  'duration',
  'ease',
  'delay',
  'immediateRender',
  'overwrite',
  'data',
  'id',
  // o GSAP escreve `parent` no vars de todo filho adicionado por `tl.to(...)`
  'parent',
  'callbackScope',
  'onStart',
  'onUpdate',
  'onComplete',
])

type Trecho = [inicio: number, fim: number]

/** Trechos em que algum tween anima, no tempo da raiz. `data: "respiro"` não conta. */
function trechosAnimados(tl: gsap.core.Timeline, deslocamento = 0, saida: Trecho[] = []): Trecho[] {
  for (const filho of tl.getChildren(false, true, true)) {
    const inicio = deslocamento + filho.startTime()
    if (filho instanceof gsap.core.Timeline) {
      trechosAnimados(filho, inicio, saida)
    } else if (
      filho.totalDuration() > 0 &&
      filho.vars.data !== 'respiro' &&
      Object.keys(filho.vars).some((chave) => !CHAVES_DE_CONTROLE.has(chave))
    ) {
      saida.push([inicio, inicio + filho.totalDuration()])
    }
  }
  return saida
}

/**
 * Patamares tirados da coreografia: o meio de cada pausa da timeline, em progresso (0 a 1),
 * mais o começo e o fim do pin.
 */
export function pausasDaTimeline(tl: gsap.core.Timeline): number[] {
  const total = tl.duration()
  if (!(total > 0)) return [0, 1]
  const trechos = trechosAnimados(tl).sort((a, b) => a[0] - b[0])
  const pontos = [0, 1]
  let livreDesde = 0
  for (const [inicio, fim] of [...trechos, [total, total] satisfies Trecho]) {
    if (inicio - livreDesde >= total * PAUSA_MINIMA && livreDesde > 0 && inicio < total) {
      pontos.push((livreDesde + inicio) / 2 / total)
    }
    livreDesde = Math.max(livreDesde, fim)
  }
  return pontos.sort((a, b) => a - b)
}

/** O patamar seguinte na direção do gesto (1 para a frente, -1 para trás). */
export function snapNaDirecao(pontos: number[], valor: number, direcao?: number): number {
  return ScrollTrigger.snapDirectional(pontos)(valor, direcao)
}

export type SnapDePatamares = {
  snapTo: (valor: number, self?: ScrollTrigger) => number
  inertia: false
  duration: { min: number; max: number }
  delay: number
  ease: string
}

/**
 * Snap para o `scrollTrigger.snap` de um pin. Fora do toque devolve undefined (sem snap).
 * `toque` existe para o teste; em uso, vem de `soToque()`.
 */
export function snapPatamares(
  progressos: () => number[],
  toque: boolean = soToque(),
): SnapDePatamares | undefined {
  if (!toque) return undefined
  return {
    snapTo: (valor, self) => snapNaDirecao(progressos(), valor, self?.direction),
    // A inércia do dedo já aconteceu (nativa). Sem isto o ScrollTrigger soma outra, medida pelo
    // progresso da animação, que com scrub ainda corre atrás da rolagem: o snap pulava patamares.
    inertia: false,
    duration: { min: 0.25, max: 0.6 },
    delay: 0.08,
    ease: 'power2.out',
  }
}
