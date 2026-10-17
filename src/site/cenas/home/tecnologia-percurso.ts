import type { Caixa, Geometria } from './tecnologia-layout'
import { CABECA, CAUDA, faixa, type Quadro, suave } from './tecnologia-poses'

/**
 * O traço único da tecnologia. Um só percurso marinho atravessa o palco inteiro: sublinha os
 * totais e confere cada um, contorna o documento, assina duas vezes, emoldura o QR, sublinha o
 * endereço, dá baixa no comprovante, confere a convenção, corre sob o campo e desenha a linha dos
 * parecidos. Ponta reta, quinas em esquadro; curva só no meio do caminho. A rolagem move a ponta
 * (cabeça) e a cauda ao longo do mesmo percurso.
 */

/** Assinaturas: trechos cúbicos em fração da vaga (u ao longo, v para cima e para baixo). */
const ASSINATURAS: readonly (readonly number[])[][] = [
  [
    [0.12, 0, 0.2, -0.95, 0.31, -0.9, 0.28, 0.1],
    [0.26, 0.6, 0.4, 0.55, 0.45, -0.2],
    [0.5, -0.85, 0.6, -0.6, 0.58, 0.2],
    [0.56, 0.75, 0.74, 0.45, 0.8, 0],
  ],
  [
    [0.1, 0, 0.16, -1, 0.33, -0.2, 0.3, 0.3],
    [0.28, 0.9, 0.47, 0.35, 0.5, -0.5],
    [0.53, -1, 0.63, 0.65, 0.7, 0.1],
    [0.76, -0.35, 0.84, 0, 0.88, 0],
  ],
]

type Construtor = ReturnType<typeof novoPercurso>

function novoPercurso() {
  const pts: number[] = []
  /** Índice do ponto em cada marca. */
  const marcas: Record<string, number> = {}
  const ultimo = (): [number, number] => [pts[pts.length - 2], pts[pts.length - 1]]
  const curva = (
    c1x: number,
    c1y: number,
    c2x: number,
    c2y: number,
    x: number,
    y: number,
    passos = 28,
  ) => {
    const [x0, y0] = ultimo()
    for (let k = 1; k <= passos; k++) {
      const t = k / passos
      const m = 1 - t
      const a = m * m * m
      const b = 3 * m * m * t
      const c = 3 * m * t * t
      const d = t * t * t
      pts.push(a * x0 + b * c1x + c * c2x + d * x, a * y0 + b * c1y + c * c2y + d * y)
    }
  }
  return {
    pts,
    marcas,
    ir(x: number, y: number) {
      pts.push(x, y)
    },
    curva,
    /** Curva até (x, y) saindo na direção (sx, sy) e chegando na direção (cx, cy). */
    ligar(x: number, y: number, sx: number, sy: number, cx: number, cy: number) {
      const [x0, y0] = ultimo()
      const d = Math.hypot(x - x0, y - y0) * 0.42
      curva(x0 + sx * d, y0 + sy * d, x - cx * d, y - cy * d, x, y)
    },
    marcar(nome: string) {
      marcas[nome] = pts.length / 2 - 1
    },
  }
}

/** Sublinhado e conferência de cada coluna do ledger. */
function trechoErp(P: Construtor, geo: Geometria): void {
  const { erp, area } = geo
  const y = erp.yU
  P.ir(area.x - 34, y)
  P.marcar('inicio')
  P.ir(erp.colX[0], y)
  P.marcar('erp0')
  erp.colX.forEach((x, k) => {
    P.marcar(`tot${k}Ini`)
    const fim = x + erp.colW
    P.ir(fim, y)
    P.marcar(`tot${k}Fim`)
    if (k === erp.colX.length - 1) P.marcar('erpUltimo')
    // Visto ao lado do total: braço curto desce íngreme, braço longo sobe até a régua da coluna
    // seguinte. Régua e vistos são o mesmo traço.
    const g = erp.gap
    const fundo = y + Math.min(g * 0.46, erp.fonteTotal * 1.7)
    P.ir(fim + g * 0.22, fundo)
    if (k < erp.colX.length - 1) P.ir(erp.colX[k + 1], y)
    else P.ir(fim + g, y - g * 0.2)
  })
  P.marcar('erpFim')
}

/** Assinatura k na vaga dada. */
function assinar(P: Construtor, vaga: Caixa, k: number): void {
  const x = (u: number) => vaga.x + u * vaga.w
  const y = (v: number) => vaga.y + v * vaga.h
  P.ir(x(0), y(0))
  P.marcar(`ass${k + 1}Ini`)
  for (const seg of ASSINATURAS[k]) {
    if (seg.length === 8) {
      P.ir(x(seg[0]), y(seg[1]))
      P.curva(x(seg[2]), y(seg[3]), x(seg[4]), y(seg[5]), x(seg[6]), y(seg[7]))
    } else P.curva(x(seg[0]), y(seg[1]), x(seg[2]), y(seg[3]), x(seg[4]), y(seg[5]))
  }
  P.ir(x(1), y(0))
  P.marcar(`ass${k + 1}Fim`)
}

/** Contorno da capa (de baixo à direita, no sentido anti-horário) e as duas assinaturas. */
function trechoDoc(P: Construtor, { doc }: Geometria): void {
  const c = doc.capa
  P.ligar(c.x + c.w, c.y + c.h, 0, -1, 0, -1)
  P.marcar('docIni')
  P.ir(c.x + c.w, c.y)
  P.ir(c.x, c.y)
  P.ir(c.x, c.y + c.h)
  P.marcar('docFim')
  const [a1, a2] = doc.assinaturas
  P.ligar(a1.x, a1.y, 0, 1, 1, 0)
  assinar(P, a1, 0)
  assinar(P, a2, 1)
}

/** Moldura do QR e sublinhado do endereço. */
function trechoQr(P: Construtor, { qr }: Geometria): void {
  const m = qr.moldura
  P.ligar(m.x, m.y + m.h, 1, 0, 0, -1)
  P.marcar('qrIni')
  P.ir(m.x, m.y)
  P.ir(m.x + m.w, m.y)
  P.ir(m.x + m.w, m.y + m.h)
  P.ir(m.x, m.y + m.h)
  P.marcar('qrFim')
  const y = qr.url.y + 7
  P.ir(m.x, y)
  P.ir(qr.url.x + qr.urlW, y)
  P.marcar('urlFim')
}

/** Visto (✓) de tamanho s a partir de (x, y). */
function visto(P: Construtor, x: number, y: number, s: number, nome: string): void {
  P.marcar(`${nome}Ini`)
  P.ir(x + s * 0.32, y + s * 0.32)
  P.ir(x + s, y - s * 0.5)
  P.marcar(`${nome}Fim`)
}

/** Baixa do comprovante, conferência da convenção, linha de base e linha dos parecidos. */
function trechoOne(P: Construtor, geo: Geometria): void {
  const { avulsas, campo, custos } = geo
  const vc = avulsas.vistoComp
  P.ligar(vc.x, vc.y, 1, 0, 1, 1)
  visto(P, vc.x, vc.y, vc.s, 'comp')
  const vv = avulsas.vistoConv
  P.ligar(vv.x, vv.y, 0, 1, 1, 1)
  visto(P, vv.x, vv.y, vv.s, 'conv')
  const g = campo.grade
  P.ligar(g.x + g.w, campo.base, 0, 1, -1, 0)
  P.marcar('baseIni')
  P.ir(g.x, campo.base)
  P.marcar('baseFim')
  const cols = custos.colunas
  cols.forEach((col, j) => {
    const fim = j < cols.length - 1 ? (col.x + col.w + cols[j + 1].x) / 2 : g.x + g.w
    P.ir(j === 0 ? g.x : P.pts[P.pts.length - 2], col.yRef)
    P.ir(fim, col.yRef)
  })
  P.ir(g.x + g.w, campo.base)
  P.marcar('custosFim')
}

export type Percurso = {
  /** x, y alternados. */
  pts: Float32Array
  /** Comprimento acumulado até cada ponto. */
  comp: Float32Array
  /** Comprimento em cada marca. */
  marcas: Record<string, number>
}

export function montarPercurso(geo: Geometria): Percurso {
  const P = novoPercurso()
  trechoErp(P, geo)
  trechoDoc(P, geo)
  trechoQr(P, geo)
  trechoOne(P, geo)
  const pts = Float32Array.from(P.pts)
  const comp = new Float32Array(pts.length / 2)
  for (let i = 1; i < comp.length; i++) {
    comp[i] = comp[i - 1] + Math.hypot(pts[i * 2] - pts[i * 2 - 2], pts[i * 2 + 1] - pts[i * 2 - 1])
  }
  const marcas = Object.fromEntries(Object.entries(P.marcas).map(([k, i]) => [k, comp[i]]))
  return { pts, comp, marcas }
}

/** Comprimento no roteiro (cabeça ou cauda) para o progresso p. */
function noRoteiro(quadros: readonly Quadro[], p: number, marcas: Record<string, number>): number {
  if (p <= quadros[0][0]) return marcas[quadros[0][1]]
  for (let k = 1; k < quadros.length; k++) {
    const [pb, mb] = quadros[k]
    if (p > pb) continue
    const [pa, ma] = quadros[k - 1]
    return marcas[ma] + (marcas[mb] - marcas[ma]) * suave(faixa(p, pa, pb))
  }
  return marcas[quadros[quadros.length - 1][1]]
}

/** Trecho visível do traço: [cauda, cabeça] em comprimento. */
export function trechoVisivel(perc: Percurso, p: number): [number, number] {
  const cabeca = noRoteiro(CABECA, p, perc.marcas)
  return [Math.min(cabeca, noRoteiro(CAUDA, p, perc.marcas)), cabeca]
}

/** Ponto do percurso no comprimento l: [x, y, índice do ponto seguinte]. */
export function pontoEm(perc: Percurso, l: number): [number, number, number] {
  const { pts, comp } = perc
  let a = 0
  let b = comp.length - 1
  while (a < b) {
    const m = (a + b) >> 1
    if (comp[m] < l) a = m + 1
    else b = m
  }
  if (a === 0) return [pts[0], pts[1], 0]
  const t = (l - comp[a - 1]) / Math.max(1e-6, comp[a] - comp[a - 1])
  const x = pts[a * 2 - 2] + (pts[a * 2] - pts[a * 2 - 2]) * t
  const y = pts[a * 2 - 1] + (pts[a * 2 + 1] - pts[a * 2 - 1]) * t
  return [x, y, a]
}

/** Desenha o trecho [l0, l1] do percurso. */
export function tracar(
  ctx: CanvasRenderingContext2D,
  perc: Percurso,
  l0: number,
  l1: number,
): void {
  if (l1 - l0 < 0.5) return
  const [x0, y0, i0] = pontoEm(perc, l0)
  const [x1, y1, i1] = pontoEm(perc, l1)
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  for (let i = i0; i < i1; i++) ctx.lineTo(perc.pts[i * 2], perc.pts[i * 2 + 1])
  ctx.lineTo(x1, y1)
  ctx.stroke()
}
