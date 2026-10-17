import { type BaseTecnologia, QR } from './tecnologia-base'
import { type Caixa, celula, type Geometria, type Retangulo, ySumario } from './tecnologia-layout'

/**
 * Poses e roteiro do palco da tecnologia. Os mesmos N itens (um por condomínio) passam por todas
 * as etapas: número no ledger → linha numa folha → documento → barra do QR → célula do campo →
 * barra de custo. Cada pose é um Float32Array com CAMPOS valores por item; o roteiro diz em que
 * trecho da rolagem uma pose vira a seguinte. As folhas têm poses próprias.
 */

/** x, y, largura, altura, alfa da barra, cor (0 lavanda → 1 marinho), alfa dos dígitos. */
export const CAMPOS = 7
/** 0 = capa com sumário; 1 a 6 = uma folha por coluna do ERP. */
export const FOLHAS = 7
/** x, y, largura, altura, alfa. */
export const CAMPOS_FOLHA = 5

export type NomePose = 'erp' | 'folhas' | 'doc' | 'assin' | 'qr' | 'campo' | 'custos'
export type Trecho = {
  de: NomePose
  para: NomePose
  ini: number
  fim: number
  arco: number
  atraso?: 'centro'
}
export type Poses = Record<NomePose, Float32Array>

/** Trechos (0 a 1 da rolagem fixada) em que uma pose vira a seguinte. */
export const ROTEIRO: readonly Trecho[] = [
  { de: 'erp', para: 'folhas', ini: 0.14, fim: 0.21, arco: 0.35 },
  { de: 'folhas', para: 'doc', ini: 0.245, fim: 0.31, arco: 0.7 },
  { de: 'doc', para: 'assin', ini: 0.395, fim: 0.445, arco: 0.3 },
  { de: 'assin', para: 'qr', ini: 0.48, fim: 0.55, arco: 0.9 },
  { de: 'qr', para: 'campo', ini: 0.648, fim: 0.71, arco: 0.8, atraso: 'centro' },
  { de: 'campo', para: 'custos', ini: 0.905, fim: 0.945, arco: 0.5 },
]

/** Onde cada passo da legenda começa e onde cada item do Semog One fica ativo. */
export const PASSOS = [0, 0.15, 0.365, 0.475, 0.648]
export const ITENS_ONE = [0.7, 0.8, 0.858, 0.906]
export const ADENDO = 0.585
/**
 * Patamares: momentos da história em que a etapa está formada. A rolagem para neles por algumas
 * telas (só o respiro vivo continua), para dar tempo de ler o passo. `s` é o tempo da história;
 * `telas`, quanto de rolagem o patamar ocupa (desktop e celular: no celular o toque assenta no
 * meio de cada um, e um patamar curto some debaixo do dedo).
 */
export const PATAMARES = [
  { s: 0.125, telas: 0.4 }, // ERP conferido
  { s: 0.238, telas: 0.35 }, // as seis partes do PDF
  { s: 0.348, telas: 0.4 }, // PDF com sumário e abas
  { s: 0.455, telas: 0.4 }, // assinado, com parecer
  { s: 0.638, telas: 0.45 }, // QR, endereço e adendo
  { s: 0.79, telas: 0.4 }, // comprovante lido e baixado
  { s: 0.852, telas: 0.4 }, // convenção lida e conferida
  { s: 0.904, telas: 0.4 }, // painel de saúde atualizado
  { s: 0.964, telas: 0.4 }, // custos por categoria
]
/**
 * Telas de rolagem por unidade de história, fora dos patamares. O pin termina no fim do último
 * patamar: dali em diante o palco sai pela rolagem, já sobre fundo branco.
 */
const TELAS_POR_HISTORIA = { largo: 2.4, estreito: 2 }
/** Tempo da história em que o pin termina. */
const FIM_DO_PIN = PATAMARES[PATAMARES.length - 1].s
/** Patamar para onde cada botão da trilha leva. */
const PATAMAR_DA_TRILHA = [0, 2, 3, 4, 5]

export type Mapa = ReturnType<typeof criarMapa>

/** Mapa rolagem → história: nós (telas, s) com trechos planos nos patamares. */
export function criarMapa(estreito: boolean) {
  const k = estreito ? TELAS_POR_HISTORIA.estreito : TELAS_POR_HISTORIA.largo
  const nos: [number, number][] = [[0, 0]]
  let telas = 0
  let s = 0
  for (const pat of PATAMARES) {
    telas += (pat.s - s) * k
    nos.push([telas, pat.s])
    telas += pat.telas
    nos.push([telas, pat.s])
    s = pat.s
  }
  const total = telas
  /** Progresso do pin no meio do patamar j. */
  const meioDoPatamar = (j: number) => (nos[1 + j * 2][0] + nos[2 + j * 2][0]) / 2 / total
  return {
    /** Extensão do pin em telas. */
    total,
    /** Tempo da história para o progresso p do pin (0 a 1). */
    historia(p: number): number {
      const x = p * total
      for (let i = 1; i < nos.length; i++) {
        const [xa, sa] = nos[i - 1]
        const [xb, sb] = nos[i]
        if (x <= xb) return xb === xa ? sb : sa + ((sb - sa) * (x - xa)) / (xb - xa)
      }
      return FIM_DO_PIN
    },
    /** Progresso do pin no meio do patamar do botão k da trilha. */
    alvoDaTrilha(k: number): number {
      return meioDoPatamar(PATAMAR_DA_TRILHA[k] ?? 0)
    },
    /**
     * Onde o toque assenta: o começo do pin, o meio de cada patamar e o fim (que já é o fim do
     * último patamar, por isso ele entra como 1).
     */
    patamares(): number[] {
      return [0, ...PATAMARES.slice(0, -1).map((_, j) => meioDoPatamar(j)), 1]
    },
  }
}

/** Um ponto do roteiro do traço: [progresso, nome da marca no percurso]. */
export type Quadro = readonly [number, string]

/**
 * Ponta do traço: [p, marca]. Entre marcas, o traço anda com ease in-out. Nas etapas a cauda
 * espera no começo do desenho (ele fica); nas ligações ela vem logo atrás da ponta, e o que se vê
 * é uma pena que viaja.
 */
export const CABECA: readonly Quadro[] = [
  [0, 'inicio'],
  [0.02, 'erp0'],
  [0.12, 'erpFim'],
  [0.27, 'erpFim'],
  [0.29, 'docIni'],
  [0.34, 'docFim'],
  [0.35, 'docFim'],
  [0.37, 'ass1Ini'],
  [0.4, 'ass1Fim'],
  [0.41, 'ass2Ini'],
  [0.44, 'ass2Fim'],
  [0.515, 'ass2Fim'],
  [0.54, 'qrIni'],
  [0.575, 'qrFim'],
  [0.59, 'urlFim'],
  [0.745, 'urlFim'],
  [0.765, 'compIni'],
  [0.785, 'compFim'],
  [0.82, 'compFim'],
  [0.835, 'convIni'],
  [0.85, 'convFim'],
  [0.862, 'convFim'],
  [0.875, 'baseIni'],
  [0.905, 'baseFim'],
  [0.935, 'baseFim'],
  [0.962, 'custosFim'],
]
/** Cauda do traço: o que já foi dito se recolhe enquanto a etapa seguinte se forma. */
export const CAUDA: readonly Quadro[] = [
  [0, 'inicio'],
  [0.15, 'inicio'],
  [0.215, 'erpUltimo'],
  [0.27, 'erpUltimo'],
  [0.293, 'docIni'],
  [0.47, 'docIni'],
  [0.515, 'ass2Fim'],
  [0.525, 'ass2Fim'],
  [0.548, 'qrIni'],
  [0.65, 'qrIni'],
  [0.71, 'urlFim'],
  [0.75, 'urlFim'],
  [0.77, 'compIni'],
  [0.82, 'compIni'],
  [0.84, 'convIni'],
  [0.862, 'convIni'],
  [0.88, 'baseIni'],
]

export const limitar = (v: number, a = 0, b = 1): number => Math.min(b, Math.max(a, v))
/** Fração de p entre ini e fim, limitada a [0, 1]. */
export const faixa = (p: number, ini: number, fim: number): number =>
  limitar((p - ini) / (fim - ini))
/** Cubic in-out. */
export const suave = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
/** Expo out. */
export const expoOut = (t: number): number => (t >= 1 ? 1 : 1 - 2 ** (-10 * t))

export const novaPose = (n: number): Float32Array => new Float32Array(n * CAMPOS)

function definir(pose: Float32Array, i: number, v: readonly number[]): void {
  pose.set(v, i * CAMPOS)
}

/* ---- Conteúdo de cada folha (em fração da folha) ------------------------------ */

function linhasTexto(qtd: number, y0: number, y1: number, sortear: () => number): Retangulo[] {
  const passo = (y1 - y0) / Math.max(1, qtd)
  return Array.from({ length: qtd }, (_, j) => {
    const fimParagrafo = sortear() < 0.18
    const w = 0.82 * (fimParagrafo ? 0.3 + sortear() * 0.3 : 0.86 + sortear() * 0.14)
    return [0.09, y0 + j * passo, w, Math.max(0.004, passo * 0.34), 0.4]
  })
}

const CABECALHO: Retangulo = [0.09, 0.13, 0.46, 0.018, 1]

/** Extratos: rótulo à esquerda, valor à direita. */
function extratos(qtd: number, sortear: () => number): Retangulo[] {
  const pares = Math.ceil(qtd / 2)
  const passo = 0.7 / pares
  return Array.from({ length: qtd }, (_, j) => {
    const y = 0.2 + Math.floor(j / 2) * passo
    const h = Math.max(0.004, passo * 0.3)
    return j % 2 ? [0.71, y, 0.2, h, 0.7] : [0.09, y, 0.28 + sortear() * 0.26, h, 0.4]
  })
}

/** Receitas: seis barras horizontais e texto. */
function receitas(qtd: number, sortear: () => number): Retangulo[] {
  const barras: Retangulo[] = Array.from({ length: Math.min(6, qtd) }, (_, j) => [
    0.09,
    0.2 + j * 0.052,
    0.16 + sortear() * 0.66,
    0.03,
    0.66,
  ])
  return barras.concat(linhasTexto(qtd - barras.length, 0.55, 0.92, sortear))
}

/** Inadimplência e acordos: grade de blocos, alguns em destaque. */
function inadimplencia(qtd: number, sortear: () => number): Retangulo[] {
  return Array.from({ length: qtd }, (_, j) => {
    const c = j % 6
    const r = Math.floor(j / 6)
    return [0.09 + c * 0.14, 0.2 + r * 0.075, 0.11, 0.05, sortear() < 0.28 ? 1 : 0.2]
  })
}

/** Demonstrativo: gráfico de barras (o de linha é desenhado à parte) e texto. */
function demonstrativo(qtd: number, sortear: () => number): Retangulo[] {
  const nb = Math.min(14, Math.max(0, qtd - 6))
  const largura = 0.82 / Math.max(1, nb)
  const barras: Retangulo[] = Array.from({ length: nb }, (_, j) => {
    const h = 0.07 + sortear() * 0.24
    return [0.09 + j * largura, 0.52 - h, largura * 0.62, h, 0.72]
  })
  return barras.concat(linhasTexto(qtd - nb, 0.8, 0.93, sortear))
}

/** Despesas: miniatura do comprovante e duas linhas por lançamento. */
function despesas(qtd: number, sortear: () => number): Retangulo[] {
  const linhas = Math.ceil(qtd / 3)
  const passo = 0.72 / linhas
  return Array.from({ length: qtd }, (_, j) => {
    const y = 0.2 + Math.floor(j / 3) * passo
    const h = Math.max(0.004, passo * 0.16)
    if (j % 3 === 0) return [0.09, y, 0.13, passo * 0.72, 0.28]
    if (j % 3 === 1) return [0.27, y + passo * 0.12, 0.38 + sortear() * 0.3, h, 0.4]
    return [0.27, y + passo * 0.42, 0.2 + sortear() * 0.2, h, 0.4]
  })
}

const TIPOS: ReadonlyArray<(qtd: number, sortear: () => number) => Retangulo[]> = [
  (q, s) => linhasTexto(q, 0.2, 0.92, s),
  extratos,
  receitas,
  inadimplencia,
  demonstrativo,
  despesas,
]

/**
 * Retângulos (em fração da folha) de cada coluna, na ordem dos itens: o primeiro é o cabeçalho da
 * folha.
 */
export function conteudoFolhas(
  base: BaseTecnologia,
  sorteador: (semente: number) => () => number,
): Retangulo[][] {
  return base.colunas.map(({ qtd }, k) => {
    const sortear = sorteador(101 + k)
    return [CABECALHO, ...TIPOS[k](qtd - 1, sortear)]
  })
}

/* ---- Poses dos itens ---------------------------------------------------------- */

function naFolha(u: Retangulo, R: Caixa, a: number): number[] {
  return [R.x + u[0] * R.w, R.y + u[1] * R.h, u[2] * R.w, Math.max(1, u[3] * R.h), a, u[4], 0]
}

/** Ledger final: cada número alinhado à direita na sua coluna. */
function poseErp(geo: Geometria, base: BaseTecnologia): Float32Array {
  const pose = novaPose(base.n)
  const { erp } = geo
  base.colunas.forEach(({ ini, qtd }, k) => {
    for (let r = 0; r < qtd; r++) {
      const i = ini + r
      const w = geo.larguraNumero[i]
      const h = Math.max(1.2, erp.lh * 0.16)
      const y = erp.yTop + (r + 0.5) * erp.lh - h / 2
      definir(pose, i, [erp.colX[k] + erp.colW - w, y, w, h, 0, 0.45, 1])
    }
  })
  return pose
}

function poseFolhas(geo: Geometria, base: BaseTecnologia): Float32Array {
  const pose = novaPose(base.n)
  base.colunas.forEach(({ ini, qtd }, k) => {
    for (let r = 0; r < qtd; r++)
      definir(pose, ini + r, naFolha(geo.conteudo[k][r], geo.folhas[k], 1))
  })
  return pose
}

/** Índices que viram o sumário da capa: [item, retângulo em fração da capa]. */
function itensSumario(base: BaseTecnologia): [number, Retangulo][] {
  const lista: [number, Retangulo][] = []
  base.colunas.forEach(({ ini }, k) => {
    const y = ySumario(k)
    lista.push([ini, [0.09, y, 0.3 + ((k * 7) % 5) * 0.045, 0.014, 0.62]])
    lista.push([ini + 1, [0.83, y, 0.08, 0.014, 0.62]])
  })
  const ini0 = base.colunas[0].ini
  lista.push([ini0 + 2, [0.09, 0.075, 0.48, 0.03, 1]])
  lista.push([ini0 + 3, [0.09, 0.122, 0.26, 0.012, 0.45]])
  return lista
}

/** Documento: sumário na capa; o resto, invisível, na sua folha da pilha. */
function poseDoc(geo: Geometria, base: BaseTecnologia, parecerFora: boolean): Float32Array {
  const pose = novaPose(base.n)
  base.colunas.forEach(({ ini, qtd }, k) => {
    const fora = parecerFora && k === 0
    const R = fora ? geo.doc.parecer : geo.doc.pilha[k]
    for (let r = 0; r < qtd; r++)
      definir(pose, ini + r, naFolha(geo.conteudo[k][r], R, fora ? 1 : 0))
  })
  for (const [i, u] of itensSumario(base)) definir(pose, i, naFolha(u, geo.doc.capa, 1))
  return pose
}

function poseQr(geo: Geometria, base: BaseTecnologia): Float32Array {
  const pose = novaPose(base.n)
  const b = geo.qr.barra
  base.modulos.forEach(({ c, r }, i) => {
    definir(pose, i, [b.x0 + c * b.passoX, b.y0 + r * b.passoY, b.w, b.h, 1, 1, 0])
  })
  return pose
}

function poseCampo(geo: Geometria, base: BaseTecnologia): Float32Array {
  const pose = novaPose(base.n)
  for (let i = 0; i < base.n; i++) {
    const cel = celula(geo.campo, i)
    definir(pose, i, [cel.x, cel.y, cel.w, cel.h, 1, base.nivel[i], 0])
  }
  return pose
}

/** Barras por categoria; acima da linha dos parecidos, marinho. */
function poseCustos(geo: Geometria, base: BaseTecnologia): Float32Array {
  const pose = novaPose(base.n)
  const { custos, campo } = geo
  const { cat, vaga } = base.categorias
  for (let i = 0; i < base.n; i++) {
    const col = custos.colunas[cat[i]]
    const linha = Math.floor(vaga[i] / custos.porLinha)
    const x = col.x + (vaga[i] % custos.porLinha) * custos.passoX
    const h = campo.barH * custos.escala
    const y = custos.fundo - (linha + 1) * custos.passoY + campo.vao * custos.escala
    const c = linha >= col.ref ? 1 : 0.3
    definir(pose, i, [x, y, campo.barW * custos.escala, h, 1, c, 0])
  }
  return pose
}

export function calcularPoses(geo: Geometria, base: BaseTecnologia): Poses {
  return {
    erp: poseErp(geo, base),
    folhas: poseFolhas(geo, base),
    doc: poseDoc(geo, base, false),
    assin: poseDoc(geo, base, true),
    qr: poseQr(geo, base),
    campo: poseCampo(geo, base),
    custos: poseCustos(geo, base),
  }
}

/** Atraso de cada item quando o QR se abre: do centro para fora. */
export function atrasoDoCentro(base: BaseTecnologia): Float32Array {
  const atrasos = new Float32Array(base.n)
  const cx = (QR.colunas - 1) / 2
  const cy = (QR.linhas - 1) / 2
  base.modulos.forEach(({ c, r }, i) => {
    const d = Math.hypot((c - cx) / (cx + 1), (r - cy) / (cy + 1)) / Math.SQRT2
    atrasos[i] = Math.min(1, d + base.sementes[i] * 0.15)
  })
  return atrasos
}

/* ---- Poses das folhas --------------------------------------------------------- */

const folha = (R: Caixa, a: number): number[] => [R.x, R.y, R.w, R.h, a]

export function calcularFolhas(geo: Geometria): Poses {
  const { doc, erp, qr } = geo
  const capaAcima = { ...doc.capa, y: doc.capa.y - doc.capa.h * 0.06 }
  const colunas = erp.colX.map((x) => ({
    x: x - 8,
    y: erp.yTop - 8,
    w: erp.colW + 16,
    h: erp.yU - erp.yTop + erp.fonteTotal * 2.2 + 8,
  }))
  const montar = (capa: Caixa, aCapa: number, outras: Caixa[], aOutras: number) => {
    const pose = new Float32Array(FOLHAS * CAMPOS_FOLHA)
    pose.set(folha(capa, aCapa), 0)
    outras.forEach((R, k) => {
      pose.set(folha(R, aOutras), (k + 1) * CAMPOS_FOLHA)
    })
    return pose
  }
  const assin = doc.pilha.map((R, k) => (k === 0 ? doc.parecer : R))
  const cartao = Array.from({ length: 6 }, () => qr.cartao)
  return {
    erp: montar(capaAcima, 0, colunas, 0),
    folhas: montar(capaAcima, 0, geo.folhas, 1),
    doc: montar(doc.capa, 1, doc.pilha, 1),
    assin: montar(doc.capa, 1, assin, 1),
    qr: montar(qr.cartao, 1, cartao, 0),
    campo: montar(qr.cartao, 0, cartao, 0),
    custos: montar(qr.cartao, 0, cartao, 0),
  }
}

/* ---- Mistura ------------------------------------------------------------------ */

/**
 * Mistura duas poses de itens. Cada item sai com atraso próprio e faz um arco: enxame com inércia,
 * não interpolação rígida. Os dígitos somem na primeira metade do percurso.
 */
export function misturarItens(
  a: Float32Array,
  b: Float32Array,
  t: number,
  saida: Float32Array,
  atrasos: Float32Array,
  sementes: Float32Array,
  amplitude: number,
): Float32Array {
  const n = sementes.length
  for (let i = 0; i < n; i++) {
    const e = suave(limitar((t - atrasos[i] * 0.35) / 0.65))
    const arco = Math.sin(e * Math.PI) * amplitude
    const s = sementes[i] * 40
    const o = i * CAMPOS
    saida[o] = a[o] + (b[o] - a[o]) * e + Math.cos(s) * arco
    saida[o + 1] = a[o + 1] + (b[o + 1] - a[o + 1]) * e + Math.sin(s) * arco
    for (let f = 2; f < 6; f++) {
      if (f !== 4) saida[o + f] = a[o + f] + (b[o + f] - a[o + f]) * e
    }
    // Quem aparece aparece no fim do voo; quem some, some no começo: nada de fantasma no ar.
    const ea = b[o + 4] > a[o + 4] ? e * e * e : 1 - (1 - e) ** 3
    saida[o + 4] = a[o + 4] + (b[o + 4] - a[o + 4]) * ea
    saida[o + 6] = a[o + 6] + (b[o + 6] - a[o + 6]) * Math.min(1, e * 3)
  }
  return saida
}

/** Folhas: cada uma com um pequeno atraso sobre a anterior. */
export function misturarFolhas(
  a: Float32Array,
  b: Float32Array,
  t: number,
  saida: Float32Array,
): Float32Array {
  for (let k = 0; k < FOLHAS; k++) {
    const e = suave(limitar((t - k * 0.05) / 0.7))
    for (let f = 0; f < CAMPOS_FOLHA; f++) {
      const o = k * CAMPOS_FOLHA + f
      saida[o] = a[o] + (b[o] - a[o]) * e
    }
  }
  return saida
}

export type TrechoAtual = { de: NomePose; para: NomePose; t: number; trecho: Trecho | null }

/** Trecho atual do roteiro, ou a pose parada (`trecho` nulo). */
export function trechoAtual(p: number): TrechoAtual {
  let atual = ROTEIRO[0].de
  for (const trecho of ROTEIRO) {
    if (p >= trecho.fim) {
      atual = trecho.para
      continue
    }
    if (p > trecho.ini)
      return { de: trecho.de, para: trecho.para, t: faixa(p, trecho.ini, trecho.fim), trecho }
    break
  }
  return { de: atual, para: atual, t: 1, trecho: null }
}

/**
 * Ledger em formação: os números descem para as suas linhas, de baixo para cima e coluna a coluna,
 * enquanto a seção chega à tela (f de 0 a 1). `queda` em px.
 */
export function erpEmQueda(
  erp: Float32Array,
  base: BaseTecnologia,
  f: number,
  saida: Float32Array,
  queda: number,
): Float32Array {
  saida.set(erp)
  base.colunas.forEach(({ ini, qtd }, k) => {
    for (let r = 0; r < qtd; r++) {
      const i = ini + r
      const e = suave(limitar((f - k * 0.05 - (1 - r / qtd) * 0.5) / 0.25))
      saida[i * CAMPOS + 1] -= (1 - e) * queda
      saida[i * CAMPOS + 6] = e
    }
  })
  return saida
}
