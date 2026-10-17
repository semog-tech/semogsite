import type { ContextoCena } from '@/site/core/tipos'
import type { Pintura } from '@/site/core/util'

/**
 * Cena do ranking. Abre com a chamada de liderança e a explica pelos números num palco fixado:
 * um campo de pontos (as administradoras da base Superlógica) se filtra no Top 200, depois no
 * G20 Condo, e um único ponto (a Semog, 5º entre mais de 3.500 administradoras) acende em
 * marinho e viaja até virar a régua de onde nasce o "5º". Depois do pin, a linha dos três ciclos se desenha e a foto abre. Sem canvas 2D,
 * a cena segue só com o texto, que é a versão completa.
 */

type Faixa = readonly [number, number]
type Passo = { readonly entra: Faixa | null; readonly sai: Faixa }
type EstadoRanking = { p: number; chegada: number }
type Area = { x0: number; x1: number; y0: number; y1: number }
type Tamanhos = {
  ponto: number
  fileiraW: number
  fileiraH: number
  grupoW: number
  grupoH: number
}
type Geometria = {
  w: number
  h: number
  compacta: boolean
  campo: Float32Array
  fileira: Float32Array
  resto: Float32Array
  grupo: Float32Array
  regua: { x: number; y: number; w: number; h: number }
  tam: Tamanhos
  centro: { x: number; y: number }
}
type Tempos = {
  top: number
  g20: number
  revela: number
  marca: number
  regua: number
  chegada: number
}
type TextoMascarado = { posicionar: (dentro: number, fora: number) => void }

/** Ranking Top 200 e G20 Condo: os nomes são os tamanhos dos grupos. */
const TOP = 200
const G20 = 20
/** Índice do ponto da Semog: a posição no ranking, contando de zero. */
const PONTO_SEMOG = 4

/** Trechos da rolagem fixada (p de 0 a 1) em que o campo muda de forma. */
const FASES = {
  revela: [0.06, 0.16],
  top: [0.2, 0.4],
  g20: [0.5, 0.64],
  marca: [0.64, 0.7],
  regua: [0.7, 0.85],
} as const satisfies Record<string, Faixa>
/** Janelas dos passos, na ordem do HTML (a chamada é o primeiro). Um só entra quando o anterior saiu. */
const PASSOS: readonly Passo[] = [
  { entra: null, sai: [0.06, 0.12] },
  { entra: [0.12, 0.2], sai: [0.3, 0.35] },
  { entra: [0.35, 0.43], sai: [0.55, 0.6] },
  { entra: [0.6, 0.67], sai: [0.75, 0.8] },
]
const MANCHETE = {
  numeral: [0.81, 0.9],
  peso: [0.83, 0.97],
  frase: [0.85, 0.94],
} as const satisfies Record<string, Faixa>
/** Onde o toque assenta: a chamada no começo, o meio de cada passo inteiro na tela e a manchete. */
export const PATAMARES_RANKING: number[] = [
  0,
  ...PASSOS.slice(1).map(({ entra, sai }) => ((entra?.[1] ?? 0) + sai[0]) / 2),
  1,
]
/** Chegada (antes do pin) em que a chamada sobe da máscara. */
const CHAMADA_CHEGADA: Faixa = [0.15, 0.65]
/** Peso final do "5º": 550 equilibra com os títulos leves da página. */
const PESO_NUMERAL = 550
const NIVEIS = 40

const faixa = (v: number, a: number, b: number): number =>
  v <= a ? 0 : v >= b ? 1 : (v - a) / (b - a)
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
const suave = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
/** Cada ponto parte um pouco depois do outro: o movimento corre como onda, não em bloco. */
const local = (t: number, atraso: number): number =>
  suave(faixa(t, atraso * 0.35, atraso * 0.35 + 0.65))

export function cenaRanking(ctx: ContextoCena): () => void {
  const { root, util, gsap } = ctx
  const palco = root.querySelector('.ranking-palco')
  if (!(palco instanceof HTMLElement)) throw new Error('[cena ranking] .ranking-palco ausente.')
  root.classList.add('ranking-com-palco')
  const estado: EstadoRanking = { p: 0, chegada: 0 }

  const textos = montarTextos(ctx)
  const aplicar = () => textos.aplicar(estado)
  const tl = util.pinScrub(root, {
    alvo: palco,
    // No celular os passos ficam mais longos: o toque assenta no meio de cada um, e com 200%
    // eles ficavam a ~0,5 tela um do outro, menos que um flick curto.
    distancia: ctx.estreito() ? '+=300%' : '+=215%',
    patamares: () => PATAMARES_RANKING,
  })
  tl.to(estado, { p: 1, duration: 1, onUpdate: aplicar })
  gsap.to(estado, {
    chegada: 1,
    ease: 'none',
    onUpdate: aplicar,
    scrollTrigger: { trigger: root, start: 'top 95%', end: 'top 15%', scrub: 0.6 },
  })
  aplicar()

  const desligarCampo = ligarCampo(ctx, palco, estado)
  animarHistorico(ctx)
  const foto = root.querySelector('.ranking-foto')
  if (foto instanceof HTMLElement) util.revelarQuadro(foto, ctx.reportar)
  return desligarCampo
}

/* ---- Texto por máscara, dirigido pela rolagem ------------------------------------ */

function montarTextos(ctx: ContextoCena): { aplicar: (e: EstadoRanking) => void } {
  const { root, gsap, SplitText } = ctx
  const passos = Array.from(root.querySelectorAll('.ranking-passo')).map((passo) =>
    Array.from(passo.querySelectorAll('[data-texto]')).map((el) =>
      dividir(SplitText, el, 'lines', (partes) => linhaDeIdaEVolta(ctx.gsap, partes, el)),
    ),
  )
  const frase = dividir(SplitText, root.querySelector('.ranking-entre'), 'words', (partes) =>
    gsap
      .timeline({ paused: true })
      .fromTo(
        partes,
        { yPercent: 110 },
        { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.06 },
      ),
  )
  const numeral = root.querySelector('.ranking-posicao')
  if (!(numeral instanceof HTMLElement)) throw new Error('[cena ranking] numeral ausente.')
  // `as` com motivo: o `quickSetter` do GSAP é tipado como `Function` (gsap-core.d.ts), o que
  // faria `subir(...)` devolver `any`; a assinatura real é (valor: number) => void.
  const subir = gsap.quickSetter(numeral, 'yPercent') as (valor: number) => void
  // O quickSetter e o style direto não entram no gsap.context: sem isto, a cena que quebra
  // depois do primeiro `aplicar` deixava o "5º" escondido abaixo da máscara no HTML estático.
  ctx.util.registrarDesligamento(() => {
    gsap.set(numeral, { clearProps: 'transform,fontVariationSettings' })
  })
  const expoOut = gsap.parseEase('expo.out')
  const pesoEase = gsap.parseEase('power2.inOut')

  return {
    aplicar(e) {
      passos.forEach((textosDoPasso, k) => {
        const { entra, sai } = PASSOS[k]
        const dentro = entra ? faixa(e.p, ...entra) : faixa(e.chegada, ...CHAMADA_CHEGADA)
        const fora = faixa(e.p, ...sai)
        textosDoPasso.forEach((texto, j) => {
          texto.posicionar(Math.max(0, dentro - j * 0.18) / (1 - j * 0.18), fora)
        })
      })
      subir(135 * (1 - expoOut(faixa(e.p, ...MANCHETE.numeral))))
      const peso = lerp(250, PESO_NUMERAL, pesoEase(faixa(e.p, ...MANCHETE.peso)))
      numeral.style.fontVariationSettings = `"wght" ${peso.toFixed(0)}`
      frase.posicionar(faixa(e.p, ...MANCHETE.frase), 0)
    },
  }
}

/** Divide o elemento em linhas ou palavras com máscara e guarda a timeline atual. */
function dividir(
  SplitText: ContextoCena['SplitText'],
  el: Element | null,
  tipo: 'lines' | 'words',
  montar: (partes: Element[]) => gsap.core.Timeline,
): TextoMascarado {
  const atual: { tl: gsap.core.Timeline | null; dentro: number; fora: number } = {
    tl: null,
    dentro: 0,
    fora: 0,
  }
  const posicionar = () => {
    const tl = atual.tl
    if (!tl) return
    const meio = tl.labels.meio ?? tl.duration()
    const tempo = atual.fora > 0 ? meio + atual.fora * (tl.duration() - meio) : atual.dentro * meio
    tl.time(tempo)
  }
  if (!(el instanceof HTMLElement)) throw new Error('[cena ranking] texto da cena ausente.')
  SplitText.create(el, {
    type: tipo,
    mask: tipo,
    autoSplit: true,
    linesClass: 'revela-linha',
    wordsClass: 'revela-palavra',
    onSplit(self) {
      atual.tl = montar(tipo === 'lines' ? self.lines : self.words)
      posicionar()
      return atual.tl
    },
  })
  return {
    posicionar(dentro, fora) {
      atual.dentro = Math.min(1, Math.max(0, dentro))
      atual.fora = fora
      posicionar()
    },
  }
}

/** Linhas entram de baixo e saem para cima; o `.peso` de dentro ganha peso na entrada. */
function linhaDeIdaEVolta(
  motor: ContextoCena['gsap'],
  linhas: Element[],
  el: Element,
): gsap.core.Timeline {
  const tl = motor
    .timeline({ paused: true })
    .fromTo(linhas, { yPercent: 110 }, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.1 })
  const pesos = el.querySelectorAll('.peso')
  if (pesos.length) {
    tl.fromTo(
      pesos,
      { fontVariationSettings: '"wght" 250' },
      { fontVariationSettings: '"wght" 600', duration: 1, ease: 'power2.inOut' },
      0.3,
    )
  }
  return tl
    .addLabel('meio')
    .fromTo(
      linhas,
      { yPercent: 0 },
      { yPercent: -110, duration: 0.7, ease: 'expo.in', stagger: 0.06, immediateRender: false },
    )
}

/* ---- Campo de pontos (canvas 2D) ---------------------------------------------------- */

/**
 * Liga o campo; devolve a limpeza do ouvinte de refresh. Ela roda no revert do gsap.context e,
 * por estar registrada, também no desmonte e quando a cena quebra depois daqui (uma vez só).
 */
function ligarCampo(ctx: ContextoCena, palco: HTMLElement, estado: EstadoRanking): () => void {
  const { root, util, ScrollTrigger, conteudo } = ctx
  const canvas = root.querySelector('.ranking-campo')
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error('[cena ranking] canvas ausente.')
  const sementes = criarSementes(conteudo.ranking.total)
  let pintura: Pintura | null = null
  let geo: Geometria | null = null
  let cor = ''
  const montar = () => {
    if (!document.documentElement.classList.contains('motion')) return
    try {
      // O canvas só tem tamanho quando aparece: a classe vem antes da medida.
      root.classList.add('ranking-com-campo')
      pintura = util.prepararCanvas2D(canvas)
      geo = medirGeometria(root, palco, sementes, ctx.estreito())
      cor = `rgb(${util.corDoToken('--marinho').join(' ')})`
    } catch (erro) {
      pintura = null
      root.classList.remove('ranking-com-campo')
      // A cena segue só com o texto; a falha vai ao Sentry (origem final `cena:ranking:campo`).
      ctx.reportar(erro, 'campo')
    }
  }
  ScrollTrigger.addEventListener('refresh', montar)
  // Registrado no rastreamento da cena: sai também se ela quebrar depois daqui.
  const desligar = util.registrarDesligamento(() =>
    ScrollTrigger.removeEventListener('refresh', montar),
  )
  montar()
  const quadro = criarQuadro(sementes.n)
  util.lacoVisivel(root, (tempo) => {
    if (!pintura || !geo) return
    calcularQuadro(quadro, { geo, sementes, estado, tempo })
    desenhar(pintura, quadro, cor)
  })
  return desligar
}

/** Números pseudoaleatórios estáveis (mulberry32): o campo é o mesmo a cada visita. */
function aleatorio(semente: number): () => number {
  let a = semente >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Por ponto: a casa no campo (embaralhada), a fase do respiro, o brilho e o atraso. */
function criarSementes(n: number) {
  const sorte = aleatorio(3500)
  const casa = Uint32Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(sorte() * (i + 1))
    ;[casa[i], casa[j]] = [casa[j], casa[i]]
  }
  const jitter = Float32Array.from({ length: n * 2 }, () => sorte())
  const fase = Float32Array.from({ length: n }, () => sorte() * Math.PI * 2)
  const brilho = Float32Array.from({ length: n }, () => sorte())
  const atraso = Float32Array.from({ length: n }, () => sorte())
  return { n, casa, jitter, fase, brilho, atraso }
}
type Sementes = ReturnType<typeof criarSementes>

function medirGeometria(
  root: HTMLElement,
  palco: HTMLElement,
  s: Sementes,
  compacta: boolean,
): Geometria {
  const caixa = palco.getBoundingClientRect()
  const area = medirArea(root, caixa, compacta)
  const tam: Tamanhos = {
    ponto: compacta ? 2 : 2.5,
    fileiraW: compacta ? 1.5 : 2,
    fileiraH: compacta ? 8 : 13,
    grupoW: compacta ? 3 : 4,
    grupoH: compacta ? 34 : 55,
  }
  return {
    w: caixa.width,
    h: caixa.height,
    compacta,
    campo: poseCampo(s, area),
    fileira: poseFileira(area, tam, compacta ? 4 : 2, TOP),
    resto: poseFileira(area, tam, compacta ? 4 : 2, TOP - G20),
    grupo: poseGrupo(area, tam),
    regua: medirRegua(root, caixa, compacta),
    tam,
    centro: { x: (area.x0 + area.x1) / 2, y: (area.y0 + area.y1) / 2 },
  }
}

/** Área livre do campo: à direita dos passos no desktop, acima deles no celular. */
function medirArea(root: HTMLElement, caixa: DOMRect, compacta: boolean): Area {
  const grade = root.querySelector('.ranking-grade')
  const passos = root.querySelector('.ranking-passos')
  if (!grade || !passos) throw new Error('[cena ranking] grade ou passos ausentes.')
  const g = grade.getBoundingClientRect()
  const l = passos.getBoundingClientRect()
  const cabecalho = document.querySelector('[data-cabecalho]')?.getBoundingClientRect().height ?? 68
  if (compacta) {
    return {
      x0: g.left - caixa.left,
      x1: g.right - caixa.left,
      y0: cabecalho + 21,
      y1: l.top - caixa.top - 34,
    }
  }
  return {
    x0: l.right - caixa.left + 55,
    x1: g.right - caixa.left,
    y0: cabecalho + 34,
    y1: caixa.height - 55,
  }
}

/** Grade com tremor: cobre a área sem formar padrão. */
function poseCampo(s: Sementes, a: Area): Float32Array {
  const w = a.x1 - a.x0
  const h = a.y1 - a.y0
  const colunas = Math.max(1, Math.round(Math.sqrt((s.n * w) / h)))
  const linhas = Math.ceil(s.n / colunas)
  const pose = new Float32Array(s.n * 2)
  for (let i = 0; i < s.n; i++) {
    const c = s.casa[i]
    const col = c % colunas
    const lin = Math.floor(c / colunas)
    pose[i * 2] = a.x0 + ((col + s.jitter[i * 2]) / colunas) * w
    pose[i * 2 + 1] = a.y0 + ((lin + s.jitter[i * 2 + 1]) / linhas) * h
  }
  return pose
}

/** Fileiras na ordem do ranking (Top 200 e, quando o G20 sobe, os 180 que ficam). */
function poseFileira(a: Area, tam: Tamanhos, fileiras: number, quantos: number): Float32Array {
  const porFileira = quantos / fileiras
  const passo = (a.x1 - a.x0) / porFileira
  const vao = 13
  const cy = (a.y0 + a.y1) / 2
  const pose = new Float32Array(quantos * 2)
  for (let i = 0; i < quantos; i++) {
    const f = Math.floor(i / porFileira)
    pose[i * 2] = a.x0 + ((i % porFileira) + 0.5) * passo - tam.fileiraW / 2
    pose[i * 2 + 1] = cy + (f - fileiras / 2) * (tam.fileiraH + vao) + vao / 2
  }
  return pose
}

/** O G20 espaçado na largura da área, com a base na mesma linha da fileira. */
function poseGrupo(a: Area, tam: Tamanhos): Float32Array {
  const passo = (a.x1 - a.x0) / G20
  const base = (a.y0 + a.y1) / 2 + tam.fileiraH / 2
  const pose = new Float32Array(G20 * 2)
  for (let i = 0; i < G20; i++) {
    pose[i * 2] = a.x0 + (i + 0.5) * passo - tam.grupoW / 2
    pose[i * 2 + 1] = base - tam.grupoH
  }
  return pose
}

/** A régua fica logo abaixo do recorte do numeral: o "5º" nasce dela. */
function medirRegua(root: HTMLElement, caixa: DOMRect, compacta: boolean): Geometria['regua'] {
  const mascara = root.querySelector('.ranking-posicao-mascara')
  if (!mascara) throw new Error('[cena ranking] máscara do numeral ausente.')
  const r = mascara.getBoundingClientRect()
  return {
    x: r.left - caixa.left,
    y: r.bottom - caixa.top + (compacta ? 5 : 8),
    w: r.width,
    h: compacta ? 2 : 3,
  }
}

/** Buffers do quadro, reaproveitados (nada é alocado no laço). */
function criarQuadro(n: number) {
  return {
    n,
    x: new Float32Array(n),
    y: new Float32Array(n),
    w: new Float32Array(n),
    h: new Float32Array(n),
    a: new Float32Array(n),
  }
}
type Quadro = ReturnType<typeof criarQuadro>
type DadosQuadro = { geo: Geometria; sementes: Sementes; t: Tempos }

function calcularQuadro(
  q: Quadro,
  {
    geo,
    sementes,
    estado,
    tempo,
  }: { geo: Geometria; sementes: Sementes; estado: EstadoRanking; tempo: number },
): void {
  const t: Tempos = {
    top: faixa(estado.p, ...FASES.top),
    g20: faixa(estado.p, ...FASES.g20),
    revela: faixa(estado.p, ...FASES.revela),
    marca: suave(faixa(estado.p, ...FASES.marca)),
    regua: faixa(estado.p, ...FASES.regua),
    chegada: estado.chegada,
  }
  for (let i = 0; i < q.n; i++) {
    posicionarNoCampo(q, i, { geo, sementes, t }, tempo)
    if (i < TOP) alinhar(q, i, { geo, sementes, t })
    else q.a[i] *= 1 - 0.62 * local(t.top, sementes.atraso[i]) - 0.3 * t.regua
  }
}

/** Pose de partida: o campo, que chega de um pouco mais aberto e respira devagar. */
function posicionarNoCampo(
  q: Quadro,
  i: number,
  { geo, sementes, t }: DadosQuadro,
  tempo: number,
): void {
  const atraso = sementes.atraso[i]
  const fase = sementes.fase[i]
  const chegou = local(t.chegada, atraso)
  const abertura = 1 + 0.16 * (1 - chegou)
  const vida = i < TOP ? 1 - local(t.top, atraso) : 1
  const amplitude = (geo.compacta ? 2 : 3) * vida
  q.x[i] = geo.centro.x + (geo.campo[i * 2] - geo.centro.x) * abertura
  q.y[i] = geo.centro.y + (geo.campo[i * 2 + 1] - geo.centro.y) * abertura
  q.x[i] += Math.sin(tempo * 0.5 + fase) * amplitude
  q.y[i] += Math.cos(tempo * 0.43 + fase * 1.7) * amplitude
  q.w[i] = geo.tam.ponto
  q.h[i] = geo.tam.ponto
  const brilho = 0.22 + 0.2 * sementes.brilho[i]
  const veu = 0.38 + 0.62 * t.revela
  q.a[i] = brilho * (0.78 + 0.22 * Math.sin(tempo * 0.9 + fase)) * chegou * veu
}

/** Top 200 → fileira; G20 → espaçados; o 5º → marinho e régua. */
function alinhar(q: Quadro, i: number, { geo, sementes, t }: DadosQuadro): void {
  const atraso = sementes.atraso[i]
  const e1 = local(t.top, atraso)
  mover(q, i, geo.fileira[i * 2], geo.fileira[i * 2 + 1], geo.tam.fileiraW, geo.tam.fileiraH, e1)
  q.a[i] = lerp(q.a[i], 0.55, e1)
  const e2 = local(t.g20, atraso)
  if (i >= G20) {
    const j = (i - G20) * 2
    mover(q, i, geo.resto[j], geo.resto[j + 1], geo.tam.fileiraW, geo.tam.fileiraH, e2)
    q.a[i] = lerp(q.a[i], 0.12, e2) * (1 - 0.4 * t.regua)
    return
  }
  mover(q, i, geo.grupo[i * 2], geo.grupo[i * 2 + 1], geo.tam.grupoW, geo.tam.grupoH, e2)
  q.a[i] = lerp(q.a[i], 0.72, e2)
  if (i !== PONTO_SEMOG) {
    q.a[i] = lerp(q.a[i], geo.compacta ? 0.08 : 0.24, t.marca)
    return
  }
  q.a[i] = lerp(q.a[i], 1, t.marca)
  tracarRegua(q, i, geo, t.regua)
}

/** O ponto da Semog encolhe numa ponta, viaja até o numeral e se estica como um traço. */
function tracarRegua(q: Quadro, i: number, geo: Geometria, t: number): void {
  const r = geo.regua
  mover(q, i, r.x, r.y, geo.tam.grupoW, r.h, suave(faixa(t, 0, 0.58)))
  q.w[i] = lerp(q.w[i], r.w, suave(faixa(t, 0.42, 1)))
}

/** Interpola o retângulo do ponto até o alvo. */
function mover(q: Quadro, i: number, x: number, y: number, w: number, h: number, t: number): void {
  q.x[i] = lerp(q.x[i], x, t)
  q.y[i] = lerp(q.y[i], y, t)
  q.w[i] = lerp(q.w[i], w, t)
  q.h[i] = lerp(q.h[i], h, t)
}

/** Uma cor só (marinho); a opacidade faz o resto, agrupada por nível para poucos fill(). */
function desenhar({ ctx, w, h }: Pintura, q: Quadro, cor: string): void {
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = cor
  for (let nivel = 1; nivel <= NIVEIS; nivel++) {
    ctx.globalAlpha = nivel / NIVEIS
    ctx.beginPath()
    for (let i = 0; i < q.n; i++) {
      if (i === PONTO_SEMOG || Math.round(q.a[i] * NIVEIS) !== nivel) continue
      ctx.rect(q.x[i], q.y[i], q.w[i], q.h[i])
    }
    ctx.fill()
  }
  ctx.globalAlpha = q.a[PONTO_SEMOG]
  ctx.fillRect(q.x[PONTO_SEMOG], q.y[PONTO_SEMOG], q.w[PONTO_SEMOG], q.h[PONTO_SEMOG])
  ctx.globalAlpha = 1
}

/* ---- Depois do pin: a linha dos ciclos ------------------------------------------- */

/** A linha se desenha da esquerda para a direita; cada ciclo acende quando a ponta passa por ele. */
function animarHistorico({ root, gsap, util }: ContextoCena): void {
  const historico = root.querySelector('.ranking-historico')
  const traco = root.querySelector('.ranking-traco')
  const titulo = root.querySelector('.ranking-historico-titulo')
  if (!historico || !traco || !(titulo instanceof HTMLElement)) return
  util.revelarTexto(titulo, { gatilho: historico, inicio: 'top 82%' })
  const desenho = gsap.parseEase('expo.inOut')
  const DURACAO = 1.3
  const tl = gsap.timeline({ scrollTrigger: { trigger: historico, start: 'top 82%', once: true } })
  tl.fromTo(traco, { scaleX: 0 }, { scaleX: 1, duration: DURACAO, ease: 'expo.inOut' }, 0.15)
  const itens = Array.from(root.querySelectorAll('.ranking-ciclos li'))
  itens.forEach((li, k) => {
    const quando = 0.15 + DURACAO * inverso(desenho, k / itens.length)
    tl.fromTo(li, { '--marca': 0 }, { '--marca': 1, duration: 0.6, ease: 'expo.out' }, quando)
    tl.from(
      li.querySelectorAll(':scope > span > span'),
      { yPercent: 110, duration: 0.9, ease: 'expo.out', stagger: 0.08 },
      quando + 0.05,
    )
  })
  util.aoImprimir(() => tl.progress(1))
}

/** Tempo (0 a 1) em que uma curva monótona chega a `alvo`, por bisseção. */
function inverso(curva: (t: number) => number, alvo: number): number {
  let a = 0
  let b = 1
  for (let k = 0; k < 24; k++) {
    const m = (a + b) / 2
    if (curva(m) < alvo) a = m
    else b = m
  }
  return (a + b) / 2
}
