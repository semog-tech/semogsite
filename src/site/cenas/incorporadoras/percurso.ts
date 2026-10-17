import type { ContextoCena } from '@/site/core/tipos'

/**
 * Cena do percurso (Incorporadoras), a cena-assinatura. Um pin só, com uma ideia: da planta às
 * chaves é um traço contínuo. Ao chegar, o projeto inteiro se desenha em lavanda, o eixo dos passos
 * se estende e o traço marinho desenha a planta; o primeiro passo sobe por máscara. Fixado, cada
 * passo tem um patamar de leitura; entre um e outro, o traço sai do chão e desenha o passo seguinte
 * enquanto a câmera acompanha a ponta, o desenho anterior recua para o fundo, o texto antigo sai
 * por cima e o novo sobe por baixo, e o traço do eixo anda até o passo. No fim, a linha do eixo se
 * estende até as bordas, desce até o pé e sobe até cobrir a tela de marinho: os ganhos sobem nesse
 * marinho, sem emenda.
 */
export function cenaPercurso(ctx: ContextoCena): void {
  const { root, util, ScrollTrigger } = ctx
  const partes = buscarPartes(root)
  root.classList.add('pc-pin')
  // A classe e o tema escritos fora do GSAP voltam ao HTML no desmonte (ou se a cena quebrar).
  const temaOriginal = root.dataset.tema ?? 'claro'
  util.registrarDesligamento(() => {
    root.classList.remove('pc-pin')
    root.dataset.tema = temaOriginal
  })
  const tl = util.pinScrub(root, {
    alvo: partes.palco,
    distancia: `+=${Math.round(DURACAO * TELAS_POR_UNIDADE * 100)}%`,
    patamares: 'pausas',
  })
  coreografar(ctx, tl, partes)
  // O tema sai do tempo da timeline a cada render e a cada refresh (o ScrollTrigger renderiza em
  // silêncio quando recalcula).
  const sincronizar = () => aplicarTema(root, tl.time() >= LIMIAR_TEMA ? 'marinho' : 'claro')
  tl.eventCallback('onUpdate', sincronizar)
  ScrollTrigger.addEventListener('refresh', sincronizar)
  util.registrarDesligamento(() => ScrollTrigger.removeEventListener('refresh', sincronizar))
  entrar(ctx, partes)
  util.aoImprimir(() => {
    aplicarTema(root, 'claro')
    ctx.gsap.set(partes.tracos, { strokeDashoffset: 0, opacity: 1 })
    ctx.gsap.set(partes.anotacoes, { opacity: 1 })
  })
}

/* ---- Ritmo ------------------------------------------------------------------------------
   A timeline do pin é medida em "unidades": cada passo ocupa uma (transição + patamar de
   leitura) e uma unidade vale 0,85 tela de rolagem. Os textos são mais longos que os marcos da
   história: o patamar é maior. */

const TELAS_POR_UNIDADE = 0.85
/** Patamar do primeiro passo antes da primeira troca (ele já entrou antes do pin). */
const PATAMAR_INICIAL = 0.6
const PASSO = 1
const TRANSICAO = 0.5
const COBRIR = 0.5
const PASSOS = 5
const INICIO_COBRIR = PATAMAR_INICIAL + (PASSOS - 1) * PASSO
/**
 * A cobertura tem duas fases: primeiro a linha do eixo se estende até as bordas da tela e o marinho
 * desce dela até o pé (ABRIR_PE da cobertura); depois sobe até o topo. Com o pé já coberto, os
 * ganhos podem subir por baixo, marinho sobre marinho, trazendo o título antes de a cobertura
 * fechar: a tela nunca fica só de marinho. Eles sobem por cima dos últimos SOBREPOSICAO_TELAS do
 * pin (margem negativa de 30svh em ganhos.css), a partir de 45% da cobertura. Os dois números
 * andam juntos.
 */
const ABRIR_PE = 0.35
const SOBREPOSICAO_TELAS = 0.3
const CAUDA = SOBREPOSICAO_TELAS / TELAS_POR_UNIDADE - 0.55 * COBRIR
const DURACAO = INICIO_COBRIR + COBRIR + CAUDA
/** Com 80% da cobertura a borda de cima já passou da linha do cabeçalho. */
const LIMIAR_TEMA = INICIO_COBRIR + COBRIR * 0.8

/** Largura do desenho (viewBox) e o centro de cada passo nele: onde a câmera para. */
const LARGURA_DESENHO = 2600
const CENTROS = [300, 775, 1310, 1810, 2300] as const
/** Opacidade do desenho de um passo que já ficou para trás. */
const RECUO = 0.32

type Partes = ReturnType<typeof buscarPartes>

function buscarPartes(root: HTMLElement) {
  const achar = (seletor: string): HTMLElement => {
    const el = root.querySelector(seletor)
    if (!(el instanceof HTMLElement)) throw new Error(`[cena percurso] falta ${seletor}.`)
    return el
  }
  const tracos = Array.from(root.querySelectorAll('.pc-traco')).filter(
    (el) => el instanceof SVGPathElement,
  )
  const passos = Array.from(root.querySelectorAll('.pc-passo')).filter(
    (el) => el instanceof HTMLElement,
  )
  const ticks = Array.from(root.querySelectorAll('.pc-ticks li')).filter(
    (el) => el instanceof HTMLElement,
  )
  if (tracos.length !== PASSOS || passos.length !== PASSOS || ticks.length !== PASSOS) {
    throw new Error(`[cena percurso] esperava ${PASSOS} traços, passos e ticks.`)
  }
  const faixa = root.querySelector('.pc-faixa')
  const trilho = root.querySelector('.pc-trilho')
  if (!(faixa instanceof SVGSVGElement) || !(trilho instanceof SVGPathElement)) {
    throw new Error('[cena percurso] falta o desenho (.pc-faixa, .pc-trilho).')
  }
  return {
    palco: achar('.pc-palco'),
    titulo: achar('.pc-titulo'),
    faixa,
    trilho,
    tracos,
    anotacoes: Array.from(root.querySelectorAll('.pc-anotacao')).filter(
      (el) => el instanceof SVGTextElement,
    ),
    passos,
    ticks,
    esquema: achar('.pc-esquema > span'),
    linha: achar('.pc-eixo-linha'),
    eixoTrilho: achar('.pc-eixo-trilho'),
    eixoTraco: achar('.pc-eixo-traco'),
    cobertura: achar('.pc-cobertura'),
    mare: achar('.pc-cobertura-mare'),
  }
}

function exigirItem<T>(lista: readonly T[], i: number, nome: string): T {
  const item = lista[i]
  if (item === undefined) throw new Error(`[cena percurso] falta ${nome} ${i}.`)
  return item
}

/** Câmera: o centro do passo `i` no meio da janela (a faixa está em left: 50%). */
const camera = (i: number): number => -(exigirItem(CENTROS, i, 'centro') / LARGURA_DESENHO) * 100

/* ---- Entrada (antes do pin) -------------------------------------------------------------- */

/**
 * Toca uma vez quando a cena chega: o projeto e o eixo se desenham, o traço desenha a planta e o
 * primeiro passo sobe por máscara.
 */
function entrar(ctx: ContextoCena, partes: Partes): void {
  const { gsap, root, util } = ctx
  util.revelarTexto(partes.titulo, { gatilho: root, inicio: 'top 72%' })
  const tl = gsap.timeline({
    scrollTrigger: { trigger: root, start: 'top 72%', toggleActions: 'play none none none' },
  })
  tl.fromTo(partes.eixoTrilho, { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: 'expo.inOut' }, 0)
    .fromTo(
      partes.trilho,
      { strokeDasharray: 1, strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 2.2, ease: 'expo.inOut' },
      0.1,
    )
    .fromTo(
      exigirItem(partes.tracos, 0, 'traço'),
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' },
      0.35,
    )
    // A entrada sobe os blocos do primeiro passo (título, texto, apoio), não as linhas .pc-in de
    // dentro: estas são do pin, e uma entrada tardia (recarga ou salto para o meio do pin) as
    // traria de volta por cima do passo da vez.
    .fromTo(
      exigirItem(partes.passos, 0, 'passo').children,
      { clipPath: 'inset(0% 0% 100% 0%)', y: 34 },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        y: 0,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.09,
        clearProps: 'clipPath,transform',
      },
      0.3,
    )
    .fromTo(
      partes.esquema,
      { yPercent: 110 },
      { yPercent: 0, duration: 1.2, ease: 'expo.out' },
      0.5,
    )
  acenderTick(tl, exigirItem(partes.ticks, 0, 'tick'), 1.1, 0.6)
  util.aoImprimir(() => tl.progress(1))
}

/* ---- Coreografia do pin ------------------------------------------------------------------ */

function coreografar({ gsap }: ContextoCena, tl: gsap.core.Timeline, partes: Partes): void {
  gsap.set(partes.tracos, { strokeDasharray: 1, strokeDashoffset: 1 })
  gsap.set(partes.faixa, { xPercent: camera(0), yPercent: -50 })
  gsap.set(partes.anotacoes, { opacity: 0 })
  for (const passo of partes.passos.slice(1)) {
    gsap.set(passo.querySelectorAll('.pc-in'), { yPercent: 110 })
  }
  for (let i = 1; i < PASSOS; i += 1) {
    const t = PATAMAR_INICIAL + (i - 1) * PASSO
    trocarPasso(
      tl,
      exigirItem(partes.passos, i - 1, 'passo'),
      exigirItem(partes.passos, i, 'passo'),
      t,
    )
    desenharPasso(tl, partes, i, t)
    andarEixo(tl, partes, i, t)
  }
  cobrir(tl, partes)
}

/** O passo antigo sai por cima; o novo sobe por baixo, ~30% depois. */
function trocarPasso(tl: gsap.core.Timeline, de: HTMLElement, para: HTMLElement, t: number): void {
  tl.fromTo(
    de.querySelectorAll('.pc-in'),
    { yPercent: 0 },
    {
      yPercent: -110,
      duration: 0.26,
      ease: 'power2.in',
      stagger: 0.04,
      immediateRender: false,
    },
    t,
  ).fromTo(
    para.querySelectorAll('.pc-in'),
    { yPercent: 110 },
    { yPercent: 0, duration: 0.36, ease: 'power3.out', stagger: 0.05, immediateRender: false },
    t + 0.16,
  )
}

/**
 * O traço desenha o passo `i` enquanto a câmera vai do centro do anterior ao dele; o desenho
 * anterior recua para o fundo no mesmo movimento e as anotações do passo, se houver, acendem
 * quando o traço chega a elas.
 */
function desenharPasso(tl: gsap.core.Timeline, partes: Partes, i: number, t: number): void {
  tl.fromTo(
    exigirItem(partes.tracos, i, 'traço'),
    { strokeDashoffset: 1 },
    { strokeDashoffset: 0, duration: TRANSICAO, ease: 'power1.inOut', immediateRender: false },
    t,
  )
    .fromTo(
      partes.faixa,
      { xPercent: camera(i - 1) },
      {
        xPercent: camera(i),
        duration: TRANSICAO,
        ease: 'power2.inOut',
        immediateRender: false,
      },
      t,
    )
    .fromTo(
      exigirItem(partes.tracos, i - 1, 'traço'),
      { opacity: 1 },
      { opacity: RECUO, duration: TRANSICAO * 0.6, ease: 'none', immediateRender: false },
      t + TRANSICAO * 0.3,
    )
  const anotacoes = partes.anotacoes.filter((a) => Number(a.dataset.passo) === i)
  if (anotacoes.length) {
    tl.fromTo(
      anotacoes,
      { opacity: 0 },
      { opacity: 1, duration: 0.2, ease: 'none', stagger: 0.08, immediateRender: false },
      t + TRANSICAO * 0.75,
    )
  }
}

/** O traço marinho do eixo anda até o passo; o tick e o nome dele acendem ao chegar. */
function andarEixo(tl: gsap.core.Timeline, partes: Partes, i: number, t: number): void {
  tl.fromTo(
    partes.eixoTraco,
    { scaleX: (i - 1) / (PASSOS - 1) },
    {
      scaleX: i / (PASSOS - 1),
      duration: TRANSICAO,
      ease: 'power2.inOut',
      immediateRender: false,
    },
    t,
  )
  acenderTick(tl, exigirItem(partes.ticks, i, 'tick'), t + TRANSICAO * 0.85, 0.16)
}

function acenderTick(tl: gsap.core.Timeline, tick: HTMLElement, t: number, duracao: number): void {
  tl.fromTo(
    tick.querySelector('i'),
    { opacity: 0.22 },
    { opacity: 1, duration: duracao, ease: 'none', immediateRender: false },
    t,
  ).fromTo(
    tick.querySelector('span'),
    { opacity: 0.45 },
    { opacity: 1, duration: duracao, ease: 'none', immediateRender: false },
    t,
  )
}

/**
 * A linha do eixo vira o marinho da cena seguinte. Dois recortes que se cruzam: o de fora
 * (.pc-cobertura) solta as laterais e o pé, e a linha se estende até as bordas e desce até o pé; o
 * de dentro (.pc-cobertura-mare) solta o topo, e o marinho sobe até cobrir o palco. As medidas saem
 * do retângulo da linha a cada refresh (o pin tem invalidateOnRefresh). A cauda, sem onUpdate, é
 * pausa de propósito.
 */
function cobrir(tl: gsap.core.Timeline, partes: Partes): void {
  const medir = () => {
    const palco = partes.palco.getBoundingClientRect()
    const linha = partes.linha.getBoundingClientRect()
    const px = (v: number) => `${Math.max(0, v).toFixed(1)}px`
    return {
      fora: `inset(0px ${px(palco.right - linha.right)} ${px(palco.bottom - linha.bottom)} ${px(
        linha.left - palco.left,
      )})`,
      dentro: `inset(${px(linha.top - palco.top)} 0px 0px 0px)`,
    }
  }
  tl.fromTo(
    partes.cobertura,
    { clipPath: () => medir().fora },
    {
      clipPath: 'inset(0px 0px 0px 0px)',
      duration: COBRIR * ABRIR_PE,
      ease: 'power2.inOut',
      immediateRender: false,
    },
    INICIO_COBRIR,
  )
    .fromTo(
      partes.mare,
      { clipPath: () => medir().dentro },
      {
        clipPath: 'inset(0px 0px 0px 0px)',
        duration: COBRIR * 0.8,
        ease: 'power3.inOut',
        immediateRender: false,
      },
      INICIO_COBRIR + COBRIR * 0.2,
    )
    .to({}, { duration: CAUDA }, INICIO_COBRIR + COBRIR)
}

/* ---- Tema --------------------------------------------------------------------------------- */

/**
 * Coberta de marinho, a cena passa a se declarar marinho. O cabeçalho é atualizado aqui também: o
 * scrub continua depois que a rolagem para, e o core só relê o tema quando há rolagem.
 */
function aplicarTema(root: HTMLElement, tema: 'claro' | 'marinho'): void {
  if (root.dataset.tema === tema) return
  root.dataset.tema = tema
  const cabecalho = document.querySelector('[data-cabecalho]')
  if (!(cabecalho instanceof HTMLElement)) return
  const linha = cabecalho.getBoundingClientRect().bottom + 1
  const caixa = root.getBoundingClientRect()
  if (caixa.top <= linha && caixa.bottom > linha) cabecalho.dataset.tema = tema
}
