'use client'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useReducedHeavy } from './useReducedHeavy'

/**
 * Mesh gradient full-bleed para o hero da home: WebGL puro (sem libs),
 * 1 quad de tela cheia + fragment shader que faz "domain warping" com ruído
 * simplex 3D — cada frame desloca o próprio espaço de amostragem com um
 * campo de ruído animado no tempo antes de amostrar os 3 campos que
 * controlam a mistura das 4 cores. É a mesma FAMÍLIA de técnica do efeito
 * "mesh gradient" popularizado pela Stripe (e recriado publicamente em
 * projetos como o "whatamesh") — mas a composição/blend abaixo é AUTORAL,
 * não porta o shader/JS de nenhum desses projetos. O único trecho de
 * terceiros aqui é a função `snoise` (ruído simplex 3D clássico de Ashima
 * Arts/Stefan Gustavson, MIT — ver atribuição logo acima dela), amplamente
 * publicada e reusada em incontáveis shaders open-source.
 *
 * Por que WebGL puro em vez de um pacote npm: o único pacote chamado
 * "whatamesh" no npm (`jordienr/whatamesh`) não declara license no
 * `package.json` (npm classifica como "Proprietary" por default) e sua
 * origem é o JS extraído do bundle da própria Stripe — não é MIT nem
 * redistribuível com segurança. Implementar o shader do zero evita esse
 * risco de licença por completo e também evita qualquer fricção de
 * SSR/Turbopack/React 19 que um pacote de terceiros pudesse trazer.
 *
 * Animação: SEMPRE rodando por padrão (rAF + `uTime` alimentando o ruído) —
 * é o requisito principal (a versão anterior, em canvas 2D com manchas
 * radiais quase estáticas, "não parecia se mover"). As 4 cores (`GRADIENT_
 * COLOR_1..4` abaixo, ÚNICO lugar pra tunar a paleta) também são escritas
 * como custom properties CSS (`--gradient-color-1..4`) no próprio
 * `<canvas>` — mesma convenção do whatamesh — e lidas de volta via
 * `getComputedStyle` no boot, então dá pra sobrescrever por CSS (ex.: uma
 * página específica) sem tocar neste arquivo.
 *
 * Sob `prefers-reduced-motion: reduce` (via `useReducedHeavy`), desenha um
 * único frame estático em `uTime = 0` — sem rAF. O campo de ruído já varia
 * no ESPAÇO (não só no tempo), então `t=0` continua sendo uma composição
 * cheia, não um frame degenerado/plano.
 *
 * Robustez: client component, WebGL só é tocado dentro de `useEffect`
 * (SSR-safe). Se `getContext('webgl')` falhar (browser antigo, contexto
 * perdido sem suporte etc.), cai pra um gradiente CSS estático com a mesma
 * paleta (`FALLBACK_GRADIENT`) — nunca um hero em branco/quebrado.
 *
 * Perf: devicePixelRatio limitado a `MAX_DPR` (1.5 — mais baixo que o canvas
 * 2D anterior de propósito: cada pixel aqui paga ~12 avaliações de ruído
 * simplex no fragment shader, então o backing store menor importa mais do
 * que nitidez retina num campo de cor borrado). O loop pausa quando o
 * canvas sai da viewport (`IntersectionObserver`) ou a aba fica oculta
 * (`visibilitychange`), retomando sozinho ao voltar.
 */

// ---------------------------------------------------------------------
// Paleta — ÚNICO lugar pra tunar as 4 cores do mesh. Família Semog
// (navy/ice) mas mais viva/multicolor que o gradiente anterior: base
// navy/indigo profunda, azul vívido, teal/cyan de acento, e um highlight
// gelo/periwinkle claro — deliberadamente "profissional vibrante", não
// arco-íris.
// ---------------------------------------------------------------------
const GRADIENT_COLOR_1 = '#070c26' // base: navy/indigo profundo (perto de --color-navy-950)
const GRADIENT_COLOR_2 = '#3450e0' // azul vívido (mais saturado que --color-navy-400)
const GRADIENT_COLOR_3 = '#17b7c4' // teal/cyan de acento (novo na paleta, dá vida)
const GRADIENT_COLOR_4 = '#c9d7ff' // highlight gelo/periwinkle (mais claro que --color-ice-400)

/** Multiplica segundos decorridos antes de virar `uTime` — velocidade global. */
const ANIMATION_SPEED = 0.35
/** Teto de devicePixelRatio — cada pixel paga ruído simplex no fragment shader. */
const MAX_DPR = 1.5

function hexToRgb01(hex: string): [number, number, number] {
  const clean = hex.trim().replace('#', '')
  if (clean.length !== 6) return [0, 0, 0]
  const r = Number.parseInt(clean.slice(0, 2), 16) / 255
  const g = Number.parseInt(clean.slice(2, 4), 16) / 255
  const b = Number.parseInt(clean.slice(4, 6), 16) / 255
  return [r, g, b]
}

/** Gradiente CSS estático (mesma paleta) — usado só se WebGL falhar. */
const FALLBACK_GRADIENT = [
  `radial-gradient(120% 100% at 15% 20%, ${GRADIENT_COLOR_2} 0%, transparent 55%)`,
  `radial-gradient(90% 80% at 85% 10%, ${GRADIENT_COLOR_4} 0%, transparent 45%)`,
  `radial-gradient(100% 90% at 80% 85%, ${GRADIENT_COLOR_3} 0%, transparent 55%)`,
  `linear-gradient(160deg, ${GRADIENT_COLOR_1} 0%, ${GRADIENT_COLOR_1} 100%)`,
].join(', ')

const VERTEX_SHADER = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;

// ---------------------------------------------------------------------
// Ruído simplex 3D — implementação clássica de Ashima Arts / Stefan
// Gustavson, MIT License (Copyright (C) 2011 Ashima Arts; Copyright (C)
// 2011-2016 Stefan Gustavson). Amplamente republicada (ex.:
// github.com/ashima/webgl-noise, github.com/stegu/webgl-noise) — reproduzida
// aqui verbatim, só o resto do shader (fbm/domain-warp/blend abaixo) é
// autoral.
// ---------------------------------------------------------------------
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// Soma de ruído fractal (fbm) com N oitavas (param octaves) — autoral.
float fbm(vec3 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    if (i >= octaves) break;
    value += amplitude * snoise(p);
    p *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  uv.x *= uResolution.x / uResolution.y;

  float t = uTime;

  // Domain warp: desloca as próprias coordenadas de amostragem com um
  // campo de ruído animado antes de usá-las — é isso que dá a sensação de
  // "fluido"/mesh em vez de manchas fixas deslizando.
  vec2 warp = vec2(
    fbm(vec3(uv * 1.4, t * 0.8), 3),
    fbm(vec3(uv * 1.4 + 5.2, t * 0.8 + 1.7), 3)
  );
  vec2 warpedUv = uv + warp * 0.6;

  float n1 = fbm(vec3(warpedUv * 1.1, t * 1.5), 2);
  float n2 = fbm(vec3(warpedUv * 1.6 + 3.0, t * 1.8 + 4.0), 2);
  float n3 = fbm(vec3(warpedUv * 2.4 - 2.0, t * 1.1 + 8.0), 2);

  float w1 = smoothstep(-0.6, 0.6, n1);
  float w2 = smoothstep(-0.5, 0.7, n2);
  float w3 = smoothstep(-0.4, 0.8, n3);

  vec3 color = uColor1;
  color = mix(color, uColor2, w1);
  color = mix(color, uColor3, w2 * 0.75);
  color = mix(color, uColor4, w3 * 0.35);

  gl_FragColor = vec4(color, 1.0);
}
`

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('[GradientBackground] shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
  if (!vs || !fs) return null
  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('[GradientBackground] program link error:', gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }
  return program
}

const CSS_VARS = {
  '--gradient-color-1': GRADIENT_COLOR_1,
  '--gradient-color-2': GRADIENT_COLOR_2,
  '--gradient-color-3': GRADIENT_COLOR_3,
  '--gradient-color-4': GRADIENT_COLOR_4,
} as CSSProperties

export function GradientBackground({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduceMotion = useReducedHeavy()
  const [webglFailed, setWebglFailed] = useState(false)

  useEffect(() => {
    if (webglFailed) return
    const canvas = canvasRef.current
    if (!canvas) return

    const contextOptions: WebGLContextAttributes = {
      antialias: true,
      alpha: false,
      premultipliedAlpha: false,
      powerPreference: 'low-power',
    }
    const gl = (canvas.getContext('webgl', contextOptions) ??
      canvas.getContext('experimental-webgl', contextOptions)) as WebGLRenderingContext | null
    if (!gl) {
      setWebglFailed(true)
      return
    }

    const program = createProgram(gl)
    if (!program) {
      setWebglFailed(true)
      return
    }

    const positionLoc = gl.getAttribLocation(program, 'aPosition')
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    )

    const uTimeLoc = gl.getUniformLocation(program, 'uTime')
    const uResolutionLoc = gl.getUniformLocation(program, 'uResolution')
    const uColor1Loc = gl.getUniformLocation(program, 'uColor1')
    const uColor2Loc = gl.getUniformLocation(program, 'uColor2')
    const uColor3Loc = gl.getUniformLocation(program, 'uColor3')
    const uColor4Loc = gl.getUniformLocation(program, 'uColor4')

    const readColor = (varName: string, fallback: string) => {
      const raw = getComputedStyle(canvas).getPropertyValue(varName).trim()
      return hexToRgb01(raw || fallback)
    }

    // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram é o método WebGL padrão (não um hook React) — o linter confunde pelo prefixo "use".
    gl.useProgram(program)
    gl.enableVertexAttribArray(positionLoc)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)
    gl.uniform3f(uColor1Loc, ...readColor('--gradient-color-1', GRADIENT_COLOR_1))
    gl.uniform3f(uColor2Loc, ...readColor('--gradient-color-2', GRADIENT_COLOR_2))
    gl.uniform3f(uColor3Loc, ...readColor('--gradient-color-3', GRADIENT_COLOR_3))
    gl.uniform3f(uColor4Loc, ...readColor('--gradient-color-4', GRADIENT_COLOR_4))

    let raf = 0

    const applySize = () => {
      const rect = (canvas.parentElement ?? canvas).getBoundingClientRect()
      const width = Math.max(1, Math.round(rect.width))
      const height = Math.max(1, Math.round(rect.height))
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uResolutionLoc, canvas.width, canvas.height)
    }

    const renderFrame = (elapsedSeconds: number) => {
      gl.uniform1f(uTimeLoc, elapsedSeconds * ANIMATION_SPEED)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    // Reduced motion: um frame estático (`uTime = 0`), sem rAF. O
    // resize/ResizeObserver continua ativo — reatribuir `canvas.width`/
    // `height` limpa o framebuffer, então cada resize precisa redesenhar.
    const resize = reduceMotion
      ? () => {
          applySize()
          renderFrame(0)
        }
      : applySize

    resize()
    window.addEventListener('resize', resize)

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : undefined
    if (ro && canvas.parentElement) ro.observe(canvas.parentElement)

    const onContextLost = (e: Event) => {
      e.preventDefault()
      cancelAnimationFrame(raf)
    }
    canvas.addEventListener('webglcontextlost', onContextLost, false)

    if (reduceMotion) {
      return () => {
        window.removeEventListener('resize', resize)
        ro?.disconnect()
        canvas.removeEventListener('webglcontextlost', onContextLost)
      }
    }

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

    const start = performance.now()
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (!visible || !pageVisible) return
      renderFrame((now - start) / 1000)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
      ro?.disconnect()
      io?.disconnect()
      canvas.removeEventListener('webglcontextlost', onContextLost)
    }
  }, [reduceMotion, webglFailed])

  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      {webglFailed ? (
        <div className="h-full w-full" style={{ background: FALLBACK_GRADIENT }} />
      ) : (
        <canvas ref={canvasRef} className="block h-full w-full" style={CSS_VARS} />
      )}
    </div>
  )
}
