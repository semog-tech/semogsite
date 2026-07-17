'use client'
import { useEffect, useRef } from 'react'
import { useReducedHeavy } from './useReducedHeavy'

/**
 * Gradiente "aurora" full-bleed para o hero da home: várias manchas radiais
 * translúcidas (`ORBS`) desenhadas em `<canvas>`, cada uma derivando devagar
 * ao longo do tempo (seno/cosseno com frequências ligeiramente diferentes
 * por eixo — uma curva de Lissajous, não um círculo perfeito) e reagindo à
 * posição do cursor via `mouseInfluence` (offset suavizado por lerp — sem
 * "pulo", a mancha persegue o mouse com um leve atraso, efeito premium em
 * vez de literal). Composição original própria (não porta nenhum código de
 * terceiros) inspirada na FAMÍLIA de efeito "aurora/mesh gradient reativo ao
 * mouse" de sites premium — paleta, timing e formas são autorais, tunados
 * ao design system Semog (`src/styles/theme.css`: navy-950/900 de base,
 * glows em ice-400/ice-300 e no azul mais saturado navy-400/navy-500).
 *
 * Sem libs externas (Canvas 2D + rAF puro) — CSP-safe por construção, não
 * depende de `script-src` adicional. Todo o "tuning" (cores, raios,
 * velocidade, influência do mouse) vive nas constantes abaixo.
 *
 * Sob `prefers-reduced-motion: reduce` (via `useReducedHeavy`, que já lê
 * esse media query — semog.js:11-15), desenha um único frame ESTÁTICO — sem
 * rAF, sem listener de mouse — reusando a mesma `draw()` para manter a
 * mesma composição visual, só congelada em t=0.
 *
 * Perf: devicePixelRatio limitado a `MAX_DPR`; o loop pausa quando o canvas
 * sai da viewport (`IntersectionObserver`) ou a aba fica oculta
 * (`visibilitychange`), retomando sozinho ao voltar.
 */

// ---------------------------------------------------------------------
// Paleta — puxada de `src/styles/theme.css` (`--color-navy-*`/`--color-ice-*`).
// ---------------------------------------------------------------------
/** Base do canvas: gradiente vertical sutil navy-900 → navy-950. */
const BASE_TOP = '#0a102e' // --color-navy-900
const BASE_BOTTOM = '#05081a' // --color-navy-950

type Orb = {
  /** [r, g, b] — sem alpha, o alpha vive em `alpha` abaixo. */
  rgb: [number, number, number]
  alpha: number
  /** Raio como fração de `max(largura, altura)` do canvas. */
  radius: number
  /** Âncora, fração do canvas (0..1). */
  x: number
  y: number
  /** Amplitude da deriva, fração do canvas. */
  driftX: number
  driftY: number
  /** Velocidade angular (rad/s) por eixo — diferente entre si de propósito,
   * pra desenhar uma curva orgânica em vez de um círculo fechado. */
  speedX: number
  speedY: number
  phase: number
  /** Quanto essa mancha "persegue" o cursor (0 = ignora, ~0.3 = forte). */
  mouseInfluence: number
}

/** 5 manchas, da mais ampla/discreta à mais reativa. Ordem = ordem de pintura. */
const ORBS: Orb[] = [
  // véu navy amplo e quase imperceptível — dá profundidade/coesão ao fundo
  {
    rgb: [27, 45, 112], // --color-navy-600
    alpha: 0.3,
    radius: 0.85,
    x: 0.5,
    y: 0.55,
    driftX: 0.06,
    driftY: 0.05,
    speedX: 0.018,
    speedY: 0.014,
    phase: 0.6,
    mouseInfluence: 0.04,
  },
  // azul profundo, canto superior-esquerdo — a mancha "principal"
  {
    rgb: [59, 84, 190], // --color-navy-400
    alpha: 0.5,
    radius: 0.5,
    x: 0.22,
    y: 0.32,
    driftX: 0.11,
    driftY: 0.09,
    speedX: 0.05,
    speedY: 0.037,
    phase: 0,
    mouseInfluence: 0.18,
  },
  // âncora inferior-direita, mais lenta
  {
    rgb: [42, 63, 150], // --color-navy-500
    alpha: 0.46,
    radius: 0.58,
    x: 0.72,
    y: 0.78,
    driftX: 0.09,
    driftY: 0.08,
    speedX: 0.03,
    speedY: 0.041,
    phase: 3.4,
    mouseInfluence: 0.08,
  },
  // glow de gelo, canto superior-direito — o brilho de destaque
  {
    rgb: [173, 213, 235], // --color-ice-400
    alpha: 0.34,
    radius: 0.38,
    x: 0.8,
    y: 0.22,
    driftX: 0.08,
    driftY: 0.1,
    speedX: 0.044,
    speedY: 0.033,
    phase: 1.9,
    mouseInfluence: 0.26,
  },
  // faísca clara central — pequena, a mais rápida a perseguir o cursor
  {
    rgb: [216, 236, 247], // --color-ice-300
    alpha: 0.22,
    radius: 0.22,
    x: 0.48,
    y: 0.55,
    driftX: 0.13,
    driftY: 0.12,
    speedX: 0.06,
    speedY: 0.052,
    phase: 5.1,
    mouseInfluence: 0.3,
  },
]

/** Suavização por frame rumo ao alvo do cursor — menor = mais "preguiçoso"/lento. */
const MOUSE_LERP = 0.045
/** Teto de devicePixelRatio — telas 4K/5K não pagam o custo de mais que isso. */
const MAX_DPR = 2

function draw(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number,
  mouseX: number,
  mouseY: number,
) {
  ctx.globalCompositeOperation = 'source-over'
  const base = ctx.createLinearGradient(0, 0, 0, height)
  base.addColorStop(0, BASE_TOP)
  base.addColorStop(1, BASE_BOTTOM)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, width, height)

  const scale = Math.max(width, height)
  ctx.globalCompositeOperation = 'lighter'

  for (const orb of ORBS) {
    const cx =
      (orb.x + Math.sin(t * orb.speedX + orb.phase) * orb.driftX + mouseX * orb.mouseInfluence) *
      width
    const cy =
      (orb.y + Math.cos(t * orb.speedY + orb.phase) * orb.driftY + mouseY * orb.mouseInfluence) *
      height
    const r = orb.radius * scale
    const [red, green, blue] = orb.rgb

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    grad.addColorStop(0, `rgba(${red}, ${green}, ${blue}, ${orb.alpha})`)
    grad.addColorStop(0.55, `rgba(${red}, ${green}, ${blue}, ${orb.alpha * 0.4})`)
    grad.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`)
    ctx.fillStyle = grad
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  }
}

export function GradientBackground({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduceMotion = useReducedHeavy()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    let width = 0
    let height = 0

    const applySize = () => {
      const rect = (canvas.parentElement ?? canvas).getBoundingClientRect()
      width = Math.max(1, Math.round(rect.width))
      height = Math.max(1, Math.round(rect.height))
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    // Reduced motion: um frame estático, sem loop de rAF nem listener de
    // mouse. Mas `resize`/`ResizeObserver` continuam ativos (a viewport pode
    // mudar — ex.: rotação de tablet) e, como reatribuir `canvas.width`/
    // `height` limpa o bitmap, cada `resize` PRECISA redesenhar o frame
    // estático — inclusive o disparo inicial assíncrono do próprio
    // `ResizeObserver` (roda depois do `draw()` síncrono abaixo, senão
    // apagaria o primeiro frame sem nunca repintar).
    const resize = reduceMotion
      ? () => {
          applySize()
          draw(ctx, width, height, 0, 0, 0)
        }
      : applySize

    resize()
    window.addEventListener('resize', resize)

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : undefined
    if (ro && canvas.parentElement) ro.observe(canvas.parentElement)

    if (reduceMotion) {
      return () => {
        window.removeEventListener('resize', resize)
        ro?.disconnect()
      }
    }

    const mouseTarget = { x: 0, y: 0 }
    const mouseCurrent = { x: 0, y: 0 }
    const onPointerMove = (e: PointerEvent) => {
      mouseTarget.x = e.clientX / window.innerWidth - 0.5
      mouseTarget.y = e.clientY / window.innerHeight - 0.5
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })

    let visible = true
    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([entry]) => {
            visible = entry?.isIntersecting ?? true
          })
        : undefined
    io?.observe(canvas)

    let pageVisible = document.visibilityState === 'visible'
    const onVisibility = () => {
      pageVisible = document.visibilityState === 'visible'
    }
    document.addEventListener('visibilitychange', onVisibility)

    let raf = 0
    const start = performance.now()
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (!visible || !pageVisible) return
      mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * MOUSE_LERP
      mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * MOUSE_LERP
      draw(ctx, width, height, (now - start) / 1000, mouseCurrent.x, mouseCurrent.y)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('visibilitychange', onVisibility)
      ro?.disconnect()
      io?.disconnect()
    }
  }, [reduceMotion])

  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  )
}
