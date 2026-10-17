import { type BaseTecnologia, formatarValor } from './tecnologia-base'
import { type Caixa, CONVENCAO, type Fontes, type Geometria } from './tecnologia-layout'
import { type Percurso, pontoEm, tracar } from './tecnologia-percurso'
import { CAMPOS, CAMPOS_FOLHA, expoOut, faixa, suave } from './tecnologia-poses'

/**
 * Pintura do palco da tecnologia (canvas 2D). Recebe o quadro já calculado (poses misturadas,
 * trecho do traço) e pinta, de trás para a frente: folhas, itens, dígitos e totais, traço, folhas
 * avulsas e rótulos. Cor só de token; ponta reta e quina em esquadro. As famílias das fontes vêm
 * do quadro (`util.familiaDaFonte`, lido no init).
 */

const PASSOS_RAMPA = 64

type Rgb = [number, number, number]

const mesclar = (a: Rgb, b: Rgb, t: number): Rgb => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
]
const rgb = (c: Rgb) => `rgb(${c[0]},${c[1]},${c[2]})`

export type Cores = ReturnType<typeof criarCores>

/**
 * Cores do palco a partir dos tokens. A rampa vai de lavanda (0) a marinho (1), passando por céu
 * e azul médio: é a cor de cada item.
 */
export function criarCores(corDoToken: (nome: string) => Rgb) {
  const marinho = corDoToken('--marinho')
  const azulMedio = corDoToken('--azul-medio')
  const ceu = corDoToken('--ceu')
  const lavanda = corDoToken('--lavanda')
  const paradas = [lavanda, ceu, azulMedio, marinho]
  const rampa = Array.from({ length: PASSOS_RAMPA + 1 }, (_, k) => {
    const x = (k / PASSOS_RAMPA) * (paradas.length - 1)
    const j = Math.min(paradas.length - 2, Math.floor(x))
    return rgb(mesclar(paradas[j], paradas[j + 1], x - j))
  })
  return {
    marinho: rgb(marinho),
    azulMedio: rgb(azulMedio),
    ceu: rgb(ceu),
    ceuClaro: rgb(corDoToken('--ceu-claro')),
    lavanda: rgb(lavanda),
    branco: rgb(corDoToken('--branco')),
    rampa,
  }
}

/** Cor da rampa para c de 0 a 1. */
const daRampa = (cores: Cores, c: number) =>
  cores.rampa[Math.round(Math.min(1, Math.max(0, c)) * PASSOS_RAMPA)]

/* ---- Números do ledger ---------------------------------------------------------- */

type Medidor = Pick<CanvasRenderingContext2D, 'measureText'>

/** Largura de um número com dígitos em passo fixo (tabular desenhado à mão). */
function medirNumero(ctx: Medidor, texto: string, passo: number): number {
  let w = 0
  for (const ch of texto) w += /\d/.test(ch) ? passo : ctx.measureText(ch).width
  return w
}

function escreverNumero(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  passo: number,
): void {
  let px = x
  for (const ch of texto) {
    const w = ctx.measureText(ch).width
    const digito = /\d/.test(ch)
    ctx.fillText(ch, digito ? px + (passo - w) / 2 : px, y)
    px += digito ? passo : w
  }
}

export type Atlas = ReturnType<typeof criarAtlas>

/**
 * Pré-desenha os N números numa folha de sprites (uma linha por item): no quadro, cada número é um
 * drawImage. Devolve também a largura de cada número.
 */
export function criarAtlas(
  base: BaseTecnologia,
  fonte: number,
  dpr: number,
  cor: string,
  saira: string,
) {
  const sonda = document.createElement('canvas').getContext('2d')
  if (!sonda) throw new Error('Canvas 2D indisponível para medir os números.')
  sonda.font = `400 ${fonte}px ${saira}, system-ui, sans-serif`
  const passo = Math.max(...Array.from('0123456789', (d) => sonda.measureText(d).width))
  const textos = Array.from(base.valores, (v) => formatarValor(v))
  const largura = Float32Array.from(textos, (t) => medirNumero(sonda, t, passo))
  const linha = Math.ceil(fonte * 1.5)
  const atlas = document.createElement('canvas')
  atlas.width = Math.max(1, Math.ceil(Math.max(...largura) * dpr) + 2)
  atlas.height = Math.max(1, Math.ceil(base.n * linha * dpr))
  const ctx = atlas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D indisponível para o ledger.')
  ctx.scale(dpr, dpr)
  ctx.font = sonda.font
  ctx.fillStyle = cor
  ctx.textBaseline = 'middle'
  textos.forEach((t, i) => {
    escreverNumero(ctx, t, 0, (i + 0.5) * linha, passo)
  })
  return { canvas: atlas, largura, linha, dpr, passo }
}

/* ---- Texto por máscara ---------------------------------------------------------- */

export type Rotulo = {
  texto: string
  x: number
  /** Linha de base. */
  y: number
  /** px. */
  tamanho: number
  /** Família real (de `Fontes`). */
  familia: string
  peso: number
  cor: string
}

/** Rótulo que entra de baixo por uma janela (máscara) e sai por cima; entrada e saída de 0 a 1. */
export function rotuloMascara(
  ctx: CanvasRenderingContext2D,
  r: Rotulo,
  entrada: number,
  saida = 0,
): void {
  if (entrada <= 0 || saida >= 1) return
  ctx.save()
  ctx.font = `${r.peso} ${r.tamanho}px ${r.familia}, system-ui, sans-serif`
  const w = ctx.measureText(r.texto).width
  const h = r.tamanho * 1.45
  ctx.beginPath()
  ctx.rect(r.x - 2, r.y - r.tamanho * 1.05, w + 4, h)
  ctx.clip()
  ctx.fillStyle = r.cor
  ctx.textBaseline = 'alphabetic'
  const desloc = (1 - expoOut(entrada)) * h - expoOut(saida) * h
  ctx.fillText(r.texto, r.x, r.y + desloc)
  ctx.restore()
}

/* ---- Quadro ------------------------------------------------------------------- */

/** Textos do palco, lidos da parcial (data-rotulo). */
export type RotulosPalco = {
  folhas: string[]
  assinaturas: string[]
  parecer: string
  url: string
  confere: string
  adendo: string
  original: string
  historico: string
  convencao: string
  condominios: string
}

export type Quadro = {
  p: number
  cabeca: number
  cauda: number
  pose: Float32Array
  folhas: Float32Array
  geo: Geometria
  base: BaseTecnologia
  cores: Cores
  atlas: Atlas
  perc: Percurso
  rotulos: RotulosPalco
  fontes: Fontes
}

/* ---- Folhas -------------------------------------------------------------------- */

/** Folha branca com fio lavanda. */
function pintarFolha(
  ctx: CanvasRenderingContext2D,
  cores: Cores,
  [x, y, w, h, a]: Float32Array | readonly number[],
): void {
  if (a <= 0.004 || w < 1) return
  ctx.globalAlpha = a
  ctx.fillStyle = cores.branco
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = cores.lavanda
  ctx.lineWidth = 1
  ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w), Math.round(h))
  ctx.globalAlpha = 1
}

const folhaK = (folhas: Float32Array, k: number) =>
  folhas.subarray(k * CAMPOS_FOLHA, (k + 1) * CAMPOS_FOLHA)

const comoFolha = (R: Caixa, a: number) => [R.x, R.y, R.w, R.h, a]

/** Abas da pilha: aparecem quando o documento se forma, recolhem na assinatura. */
function pintarAbas(ctx: CanvasRenderingContext2D, q: Quadro): void {
  const doc = q.geo.doc
  const a = suave(faixa(q.p, 0.285, 0.31)) * (1 - suave(faixa(q.p, 0.375, 0.4)))
  if (a <= 0) return
  ctx.globalAlpha = a
  doc.abas.forEach((aba, k) => {
    ctx.fillStyle = k === 0 ? q.cores.ceu : q.cores.ceuClaro
    const w = aba.w * suave(faixa(q.p, 0.285 + k * 0.004, 0.31 + k * 0.004))
    ctx.fillRect(aba.x, aba.y, w, aba.h)
  })
  ctx.globalAlpha = 1
}

/** Gráfico de linha do demonstrativo, desenhado enquanto as folhas se espalham. */
const GRAFICO = [0.7, 0.6, 0.66, 0.52, 0.58, 0.47, 0.5, 0.4, 0.44, 0.34]
function pintarGrafico(ctx: CanvasRenderingContext2D, q: Quadro): void {
  const [x, y, w, h, a] = folhaK(q.folhas, 5)
  const t = suave(faixa(q.p, 0.19, 0.24)) * (1 - faixa(q.p, 0.25, 0.27))
  if (t <= 0 || a <= 0) return
  const ponto = (j: number): [number, number] => [
    x + w * (0.09 + (0.82 * j) / (GRAFICO.length - 1)),
    y + h * (GRAFICO[j] * 0.3 + 0.48),
  ]
  const ate = t * (GRAFICO.length - 1)
  const inteiro = Math.floor(ate)
  ctx.globalAlpha = a
  ctx.strokeStyle = q.cores.azulMedio
  ctx.lineWidth = 1.25
  ctx.beginPath()
  ctx.moveTo(...ponto(0))
  for (let j = 1; j <= inteiro; j++) ctx.lineTo(...ponto(j))
  if (inteiro < GRAFICO.length - 1) {
    const [ax, ay] = ponto(inteiro)
    const [bx, by] = ponto(inteiro + 1)
    const f = ate - inteiro
    ctx.lineTo(ax + (bx - ax) * f, ay + (by - ay) * f)
  }
  ctx.stroke()
  ctx.globalAlpha = 1
}

/* ---- Itens --------------------------------------------------------------------- */

function pintarItens(ctx: CanvasRenderingContext2D, q: Quadro, filtro?: (i: number) => boolean) {
  const { pose, base, cores } = q
  for (let i = 0; i < base.n; i++) {
    if (filtro && !filtro(i)) continue
    const o = i * CAMPOS
    const a = pose[o + 4]
    if (a <= 0.01 || pose[o + 2] < 0.3) continue
    ctx.globalAlpha = a
    ctx.fillStyle = daRampa(cores, pose[o + 5])
    ctx.fillRect(pose[o], pose[o + 1], pose[o + 2], pose[o + 3])
  }
  ctx.globalAlpha = 1
}

/** Números do ledger, do atlas, com o alfa de dígito de cada item. */
function pintarDigitos(ctx: CanvasRenderingContext2D, q: Quadro): void {
  const { pose, base, atlas } = q
  const lh = atlas.linha
  for (let i = 0; i < base.n; i++) {
    const o = i * CAMPOS
    const t = pose[o + 6]
    if (t <= 0.01) continue
    const w = atlas.largura[i]
    ctx.globalAlpha = t
    ctx.drawImage(
      atlas.canvas,
      0,
      i * lh * atlas.dpr,
      w * atlas.dpr,
      lh * atlas.dpr,
      pose[o] + pose[o + 2] - w,
      pose[o + 1] + pose[o + 3] / 2 - lh / 2,
      w,
      lh,
    )
  }
  ctx.globalAlpha = 1
}

/** Totais: contam enquanto o traço sublinha a coluna; somem quando as folhas se formam. */
function pintarTotais(ctx: CanvasRenderingContext2D, q: Quadro): void {
  const { erp } = q.geo
  const saida = faixa(q.p, 0.14, 0.175)
  if (saida >= 1) return
  ctx.save()
  ctx.font = `500 ${erp.fonteTotal}px ${q.fontes.saira}, system-ui, sans-serif`
  ctx.fillStyle = q.cores.marinho
  ctx.textBaseline = 'alphabetic'
  q.base.totais.forEach((total, k) => {
    const m = q.perc.marcas
    const e = faixa(q.cabeca, m[`tot${k}Ini`], m[`tot${k}Fim`])
    if (e <= 0) return
    const texto = formatarValor(Math.round(total * suave(e)))
    const w = medirNumero(ctx, texto, q.atlas.passo * (erp.fonteTotal / erp.fonte))
    const x = erp.colX[k] + erp.colW - w
    const y = erp.yU + erp.fonteTotal * 1.6
    ctx.save()
    ctx.beginPath()
    ctx.rect(x - 4, erp.yU + 2, w + 8, erp.fonteTotal * 2)
    ctx.clip()
    const desloc =
      (1 - expoOut(Math.min(1, e * 1.6))) * erp.fonteTotal * 1.6 -
      expoOut(saida) * erp.fonteTotal * 2
    escreverNumero(ctx, texto, x, y + desloc, q.atlas.passo * (erp.fonteTotal / erp.fonte))
    ctx.restore()
  })
  ctx.restore()
}

/* ---- Folhas avulsas ----------------------------------------------------------- */

/** Linhas de texto genéricas dentro de uma folha. */
function linhasDaFolha(
  ctx: CanvasRenderingContext2D,
  R: Caixa,
  n: number,
  y0: number,
  cor: string,
  larguras: readonly number[],
): void {
  ctx.fillStyle = cor
  const passo = (0.86 - y0) / n
  for (let j = 0; j < n; j++) {
    ctx.fillRect(
      R.x + R.w * 0.1,
      R.y + R.h * (y0 + j * passo),
      R.w * 0.8 * larguras[j % larguras.length],
      Math.max(1, R.h * passo * 0.3),
    )
  }
}

/** Faixa de leitura que desce pela folha. */
function faixaLeitura(ctx: CanvasRenderingContext2D, cores: Cores, R: Caixa, t: number): void {
  if (t <= 0 || t >= 1) return
  ctx.globalAlpha = 0.55 * Math.sin(t * Math.PI)
  ctx.fillStyle = cores.ceu
  ctx.fillRect(R.x, R.y + R.h * (t * 0.92), R.w, R.h * 0.08)
  ctx.globalAlpha = 1
}

/** Adendo: entra pela direita sobre o cartão; o histórico mostra que o original ficou. */
function pintarAdendo(ctx: CanvasRenderingContext2D, q: Quadro): void {
  const e = suave(faixa(q.p, 0.585, 0.625))
  const s = suave(faixa(q.p, 0.648, 0.675))
  if (e <= 0 || s >= 1) return
  const A = q.geo.area
  const alvo = q.geo.qr.adendo
  const R = { ...alvo, x: A.x + A.w + 40 + (alvo.x - A.x - A.w - 40) * e + s * A.w * 0.4 }
  pintarFolha(ctx, q.cores, comoFolha(R, 1 - s))
  ctx.globalAlpha = 1 - s
  ctx.fillStyle = q.cores.marinho
  ctx.fillRect(R.x + R.w * 0.1, R.y + R.h * 0.2, R.w * 0.42, Math.max(1.5, R.h * 0.018))
  linhasDaFolha(ctx, R, 7, 0.3, q.cores.lavanda, [1, 0.9, 0.95, 0.6, 1, 0.8, 0.4])
  ctx.globalAlpha = 1
  const t = q.geo.tamanhos.pequeno
  const cor = q.cores.marinho
  rotuloMascara(
    ctx,
    {
      texto: q.rotulos.adendo,
      x: R.x + R.w * 0.1,
      y: R.y + R.h * 0.13,
      tamanho: t,
      familia: q.fontes.saira,
      peso: 500,
      cor,
    },
    faixa(q.p, 0.6, 0.625),
    s,
  )
  pintarHistorico(ctx, q, R, s)
}

/** Histórico do adendo: original preservado + adendo. */
function pintarHistorico(ctx: CanvasRenderingContext2D, q: Quadro, R: Caixa, s: number): void {
  const t = q.geo.tamanhos.pequeno
  const linhas: [string, string, number][] = [
    [q.rotulos.original, q.cores.lavanda, 0.605],
    [q.rotulos.historico, q.cores.marinho, 0.615],
  ]
  linhas.forEach(([texto, cor, ini], j) => {
    const y = R.y + R.h + t * 2.2 + j * t * 1.8
    const e = faixa(q.p, ini, ini + 0.02)
    ctx.globalAlpha = (1 - s) * e
    ctx.fillStyle = cor
    ctx.fillRect(R.x, y - t * 0.55, 10 * e, 3)
    ctx.globalAlpha = 1
    const familia = q.fontes.barlow
    rotuloMascara(
      ctx,
      { texto, x: R.x + 16, y, tamanho: t, familia, peso: 400, cor: q.cores.marinho },
      e,
      s,
    )
  })
}

/** Comprovante: entra, é lido, encolhe até a sua célula. */
function pintarComprovante(ctx: CanvasRenderingContext2D, q: Quadro): void {
  const { comp, celAlvo } = q.geo.avulsas
  const entra = suave(faixa(q.p, 0.712, 0.73))
  const voa = suave(faixa(q.p, 0.745, 0.768))
  if (entra <= 0 || voa >= 1) return
  const A = q.geo.area
  const x0 = A.x + A.w + 30 + (comp.x - A.x - A.w - 30) * entra
  const R = {
    x: x0 + (celAlvo.x - x0) * voa,
    y: comp.y + (celAlvo.y - comp.y) * voa,
    w: comp.w + (celAlvo.w - comp.w) * voa,
    h: comp.h + (celAlvo.h - comp.h) * voa,
  }
  pintarFolha(ctx, q.cores, comoFolha(R, 1))
  const lido = faixa(q.p, 0.725, 0.745)
  ctx.globalAlpha = 1 - voa
  linhasDaFolha(
    ctx,
    R,
    5,
    0.18,
    lido > 0.5 ? q.cores.azulMedio : q.cores.lavanda,
    [0.7, 1, 0.85, 0.5, 0.9],
  )
  ctx.fillStyle = q.cores.marinho
  ctx.fillRect(R.x + R.w * 0.1, R.y + R.h * 0.78, R.w * 0.5, Math.max(2, R.h * 0.05))
  ctx.globalAlpha = 1
  faixaLeitura(ctx, q.cores, R, lido)
}

/** Linhas da convenção: a leitura tinge o que passou; as cláusulas-chave ficam marinho. */
function linhasConvencao(ctx: CanvasRenderingContext2D, cores: Cores, R: Caixa, lido: number) {
  const passo = 0.7 / CONVENCAO.linhas
  for (let j = 0; j < CONVENCAO.linhas; j++) {
    const y = R.y + R.h * (0.2 + j * passo)
    const chave = CONVENCAO.chave.includes(j) && lido > (j + 1) / CONVENCAO.linhas
    ctx.fillStyle = chave ? cores.marinho : lido > j / CONVENCAO.linhas ? cores.ceu : cores.lavanda
    const w = R.w * 0.8 * (j % 5 === 4 ? 0.55 : 0.9 + ((j * 13) % 10) / 100)
    ctx.fillRect(
      R.x + R.w * 0.1,
      y,
      w,
      Math.max(1, chave ? R.h * passo * 0.42 : R.h * passo * 0.28),
    )
  }
}

/** Convenção: entra, a leitura destaca três cláusulas, o visto humano confere, sai. */
function pintarConvencao(ctx: CanvasRenderingContext2D, q: Quadro): void {
  const { conv } = q.geo.avulsas
  const entra = suave(faixa(q.p, 0.79, 0.81))
  const sai = suave(faixa(q.p, 0.858, 0.88))
  if (entra <= 0 || sai >= 1) return
  const A = q.geo.area
  const desloc = (1 - entra) * (A.x + A.w + 30 - conv.x) + sai * (A.x + A.w + 30 - conv.x)
  const R = { ...conv, x: conv.x + desloc }
  pintarFolha(ctx, q.cores, comoFolha(R, 1))
  const lido = faixa(q.p, 0.81, 0.835)
  linhasConvencao(ctx, q.cores, R, lido)
  faixaLeitura(ctx, q.cores, R, lido)
  const t = q.geo.tamanhos.pequeno
  rotuloMascara(
    ctx,
    Object.assign(rotulo(q, q.rotulos.convencao, R.x + R.w * 0.1, R.y + R.h * 0.12), {
      tamanho: t,
      cor: q.cores.marinho,
    }),
    faixa(q.p, 0.8, 0.82),
    sai,
  )
}

/* ---- Rótulos ------------------------------------------------------------------ */

/** Rótulos das folhas: dentro da folha na grade, ao lado da aba no documento. */
function rotulosFolhas(ctx: CanvasRenderingContext2D, q: Quadro): void {
  const { doc } = q.geo
  const virar = suave(faixa(q.p, 0.245, 0.31))
  const t = q.geo.tamanhos
  q.rotulos.folhas.forEach((texto, k) => {
    const [x, y, w, h] = folhaK(q.folhas, k + 1)
    const aba = doc.abas[k]
    const dentro = { x: x + w * 0.09, y: y + h * 0.085 + t.pequeno * 0.3 }
    const fora = { x: aba.x + aba.w + 10, y: aba.y + aba.h / 2 + t.rotulo * 0.36 }
    const r: Rotulo = {
      texto,
      x: dentro.x + (fora.x - dentro.x) * virar,
      y: dentro.y + (fora.y - dentro.y) * virar,
      tamanho: t.pequeno + (t.rotulo - t.pequeno) * virar,
      familia: q.fontes.saira,
      peso: 500,
      cor: q.cores.marinho,
    }
    rotuloMascara(
      ctx,
      r,
      faixa(q.p, 0.185 + k * 0.006, 0.225 + k * 0.006),
      faixa(q.p, 0.375, 0.395),
    )
  })
}

/** Rótulos do documento assinado, do QR e do campo. */
function rotulosEtapas(ctx: CanvasRenderingContext2D, q: Quadro): void {
  rotulosDoc(ctx, q)
  rotulosQr(ctx, q)
  const { campo, tamanhos } = q.geo
  const r = rotulo(q, q.rotulos.condominios, campo.grade.x, campo.grade.y - tamanhos.pequeno * 1.2)
  r.tamanho = tamanhos.rotulo
  r.peso = 400
  r.cor = q.cores.marinho
  rotuloMascara(ctx, r, faixa(q.p, 0.68, 0.71), faixa(q.p, 0.9, 0.925))
}

/** Rótulo em Saira 500, no tamanho pequeno; quem chama ajusta o resto. */
function rotulo(q: Quadro, texto: string, x: number, y: number): Rotulo {
  return { texto, x, y, tamanho: 12, familia: q.fontes.saira, peso: 500, cor: '' }
}

/** Quem assinou e o título do parecer; saem quando o documento condensa. */
function rotulosDoc(ctx: CanvasRenderingContext2D, q: Quadro): void {
  const t = q.geo.tamanhos.pequeno
  const fimDoc = faixa(q.p, 0.478, 0.5)
  q.geo.doc.assinaturas.forEach((vaga, k) => {
    const m = q.perc.marcas[`ass${k + 1}Fim`]
    const r = rotulo(q, q.rotulos.assinaturas[k], vaga.x, vaga.y + t * 1.9)
    Object.assign(r, { tamanho: t, familia: q.fontes.barlow, peso: 400, cor: q.cores.marinho })
    rotuloMascara(ctx, r, faixa(q.cabeca, m - 40, m), fimDoc)
  })
  const [px, py, pw, ph] = folhaK(q.folhas, 1)
  const r = rotulo(q, q.rotulos.parecer, px + pw * 0.09, py + ph * 0.085 + t * 0.3)
  Object.assign(r, { tamanho: t, cor: q.cores.marinho })
  rotuloMascara(ctx, r, faixa(q.p, 0.42, 0.445), fimDoc)
}

/** Endereço e legenda sob o QR. */
function rotulosQr(ctx: CanvasRenderingContext2D, q: Quadro): void {
  const { qr, tamanhos } = q.geo
  const sai = faixa(q.p, 0.645, 0.67)
  const url = rotulo(q, q.rotulos.url, qr.url.x, qr.url.y)
  Object.assign(url, { tamanho: tamanhos.url, peso: 400, cor: q.cores.marinho })
  rotuloMascara(ctx, url, faixa(q.p, 0.57, 0.595), sai)
  const legenda = rotulo(q, q.rotulos.confere, qr.url.x, qr.url.y + tamanhos.url * 1.7)
  Object.assign(legenda, {
    tamanho: tamanhos.pequeno,
    familia: q.fontes.barlow,
    peso: 400,
    cor: q.cores.marinho,
  })
  rotuloMascara(ctx, legenda, faixa(q.p, 0.585, 0.61), sai)
}

/* ---- Quadro ------------------------------------------------------------------- */

/** Folhas, com a do parecer por cima da capa quando sai da pilha. */
function pintarPapeis(ctx: CanvasRenderingContext2D, q: Quadro): void {
  // O parecer sai de trás da capa: enquanto está fora, folha e linhas dele vêm antes dela.
  const parecerFora = q.p > 0.395 && q.p < 0.48
  for (const k of [6, 5, 4, 3, 2, 1]) pintarFolha(ctx, q.cores, folhaK(q.folhas, k))
  const col0 = q.base.colunas[0]
  const doParecer = (i: number) => i >= col0.ini + 4 && i < col0.ini + col0.qtd
  if (parecerFora) pintarItens(ctx, q, doParecer)
  pintarFolha(ctx, q.cores, folhaK(q.folhas, 0))
  pintarAbas(ctx, q)
  pintarGrafico(ctx, q)
  pintarItens(ctx, q, parecerFora ? (i) => !doParecer(i) : undefined)
}

/** O traço único. */
function pintarTraco(ctx: CanvasRenderingContext2D, q: Quadro): void {
  ctx.strokeStyle = q.cores.marinho
  ctx.lineWidth = q.geo.area.compacta ? 1.5 : 2
  ctx.lineCap = 'butt'
  ctx.lineJoin = 'miter'
  ctx.miterLimit = 10
  tracar(ctx, q.perc, q.cauda, q.cabeca)
}

/** Pinta um quadro inteiro. */
export function pintarQuadro(ctx: CanvasRenderingContext2D, q: Quadro): void {
  ctx.clearRect(0, 0, q.geo.largura, q.geo.altura)
  pintarPapeis(ctx, q)
  pintarDigitos(ctx, q)
  pintarTotais(ctx, q)
  rotulosFolhas(ctx, q)
  pintarTraco(ctx, q)
  pintarAdendo(ctx, q)
  pintarComprovante(ctx, q)
  pintarConvencao(ctx, q)
  rotulosEtapas(ctx, q)
}

/** Frente da onda de atualização: x da ponta do traço enquanto corre sob o campo. */
export function frenteDaOnda(q: Pick<Quadro, 'perc' | 'cabeca'>): number {
  const m = q.perc.marcas
  if (q.cabeca <= m.baseIni) return Number.POSITIVE_INFINITY
  if (q.cabeca >= m.baseFim) return Number.NEGATIVE_INFINITY
  return pontoEm(q.perc, q.cabeca)[0]
}
