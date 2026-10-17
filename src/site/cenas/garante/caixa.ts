import type { ContextoCena } from '@/site/core/tipos'

/**
 * Cena do caixa do condomínio (Semog Garante), a cena-assinatura. Um pin só, com uma ideia: com o
 * Garante, a arrecadação do condomínio fica no patamar previsto todo mês, e a cobrança de quem
 * atrasou corre por baixo, fora da conta do condomínio. Ao chegar, a janela abre de cima, as doze
 * barras sobem da base em alturas irregulares e o que ficou em aberto aparece vazado no topo de
 * cada mês; o primeiro momento sobe por máscara. Fixado, cada momento tem um patamar de leitura.
 * Entre eles: um traço só, de ponta reta, corre o patamar dos 100% e cada mês se completa em céu
 * quando ele passa (a Semog Garante pagou); o traço dobra pela direita e volta pela faixa da
 * cobrança, e cada dívida desce até ela quando o traço chega embaixo do seu mês; por fim, a faixa
 * do 1% se abre logo abaixo do patamar. No fim, o patamar engrossa e cobre a tela de marinho: os
 * papéis sobem nesse marinho, sem emenda.
 */
export function cenaCaixa(ctx: ContextoCena): void {
  const { root, util, ScrollTrigger } = ctx
  const partes = buscarPartes(root)
  root.classList.add('gc-pin')
  // A classe e o tema escritos fora do GSAP voltam ao HTML no desmonte (ou se a cena quebrar).
  const temaOriginal = root.dataset.tema ?? 'claro'
  util.registrarDesligamento(() => {
    root.classList.remove('gc-pin')
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
    finalizar(ctx.gsap, partes)
  })
}

/* ---- Ritmo ------------------------------------------------------------------------------
   A timeline do pin é medida em "unidades": cada momento ocupa uma (transição + patamar de
   leitura) e uma unidade vale 0,85 tela de rolagem, como o mês da Tecnologia. */

const TELAS_POR_UNIDADE = 0.85
/** Patamar do primeiro momento antes da primeira troca (ele já entrou antes do pin). */
const PATAMAR_INICIAL = 0.6
const PASSO = 1
const MOMENTOS = 4
/** Início de cada troca de momento (1, 2 e 3). */
const TROCAS = [1, 2, 3].map((i) => PATAMAR_INICIAL + (i - 1) * PASSO)
/** O traço corre o patamar em PATAMAR_TRACO e a volta pela cobrança em VOLTA_TRACO. */
const PATAMAR_TRACO = 0.55
const VOLTA_TRACO = 0.6
/** Cada dívida leva QUEDA para descer e encosta na faixa quando o traço chega a ela. */
const QUEDA = 0.22
const COBRIR = 0.55
const INICIO_COBRIR = PATAMAR_INICIAL + (MOMENTOS - 1) * PASSO
/**
 * Os papéis sobem por cima dos últimos SOBREPOSICAO_TELAS do pin (margem negativa de 45svh em
 * papeis.css), a partir de 30% da cobertura: quando o marinho fecha a tela, o título deles já está
 * no terço de baixo, e a tela nunca fica só de marinho. Os dois números andam juntos.
 */
const SOBREPOSICAO_TELAS = 0.45
const CAUDA = SOBREPOSICAO_TELAS / TELAS_POR_UNIDADE - 0.7 * COBRIR
const DURACAO = INICIO_COBRIR + COBRIR + CAUDA
/** Com 80% da cobertura a borda de cima já passou da linha do cabeçalho. */
const LIMIAR_TEMA = INICIO_COBRIR + COBRIR * 0.8

/* ---- Geometria do desenho (a mesma do SVG de secoes/garante/Caixa.tsx) ----------------- */

const LARGURA_MES = 36
const PASSO_MES = 56
/** Fim do patamar (x) e o patamar e a faixa da cobrança (y). */
const FIM = 652
const TOPO = 48
const FAIXA = 410
/** Espessura do traço: o recorte da cobertura começa nela. */
const TRACO = 2.6

type Partes = ReturnType<typeof buscarPartes>
type Medida = ReturnType<typeof medirTraco>

function buscarPartes(root: HTMLElement) {
  const achar = (seletor: string): Element => {
    const el = root.querySelector(seletor)
    if (!el) throw new Error(`[cena caixa] falta ${seletor}.`)
    return el
  }
  const html = (seletor: string): HTMLElement => {
    const el = achar(seletor)
    if (!(el instanceof HTMLElement)) throw new Error(`[cena caixa] falta ${seletor}.`)
    return el
  }
  const todos = (seletor: string): Element[] => Array.from(root.querySelectorAll(seletor))
  const momentos = Array.from(root.querySelectorAll('.gc-momento')).filter(
    (el) => el instanceof HTMLElement,
  )
  const grafico = achar('.gc-grafico')
  const traco = achar('.gc-traco')
  const meses = todos('.gc-mes')
  if (
    momentos.length !== MOMENTOS ||
    meses.length !== 12 ||
    !(grafico instanceof SVGSVGElement) ||
    !(traco instanceof SVGPathElement)
  ) {
    throw new Error(`[cena caixa] esperava ${MOMENTOS} momentos, 12 meses e o gráfico inteiro.`)
  }
  return {
    palco: html('.gc-palco'),
    cobertura: html('.gc-cobertura'),
    grafico,
    traco,
    momentos,
    titulo: html('.gc-titulo'),
    janela: html('.gc-janela'),
    legenda: html('.gc-legenda'),
    chaveCoberto: html('.gc-chave--coberto'),
    previsto: achar('.gc-previsto'),
    pagos: todos('.gc-pago'),
    cobertos: todos('.gc-coberto'),
    abertos: todos('.gc-aberto'),
    rotulosMes: todos('.gc-mes-rotulo'),
    rotulosCobranca: todos('.gc-rotulo-cobranca'),
    custo: achar('.gc-custo'),
    custoRotulo: achar('.gc-custo-rotulo'),
  }
}

function exigirItem<T>(lista: readonly T[], i: number, nome: string): T {
  const item = lista[i]
  if (item === undefined) throw new Error(`[cena caixa] falta ${nome} ${i}.`)
  return item
}

/**
 * Onde o traço está, de 0 a 1, ao chegar a cada ponto que importa. Medido no próprio path: a curva
 * da direita tem o comprimento que o navegador calcular.
 */
function medirTraco(traco: SVGPathElement) {
  const total = traco.getTotalLength()
  const curva = total - 2 * FIM
  if (!(total > 0) || curva <= 0) throw new Error('[cena caixa] traço sem comprimento.')
  return {
    /** Fração do traço no fim do patamar. */
    patamar: FIM / total,
    /** Fração da volta (curva + faixa) em que o traço passa embaixo do mês i. */
    voltaNoMes: (i: number) => (curva + FIM - (i * PASSO_MES + LARGURA_MES / 2)) / (curva + FIM),
  }
}

/* ---- Entrada (antes do pin) ------------------------------------------------------------- */

/**
 * Toca uma vez quando a cena chega: a janela abre de cima, a linha do previsto se desenha, as
 * barras sobem da base em cascata e o vazado do que ficou em aberto aparece em cada mês; o primeiro
 * momento e a legenda sobem.
 */
function entrar(ctx: ContextoCena, partes: Partes): void {
  const { gsap, root, util } = ctx
  util.revelarTexto(partes.titulo, { gatilho: root, inicio: 'top 72%' })
  gsap.set(partes.previsto, { strokeDasharray: 1 })
  const tl = gsap.timeline({
    scrollTrigger: { trigger: root, start: 'top 72%', toggleActions: 'play none none none' },
  })
  tl.fromTo(
    partes.janela,
    { clipPath: 'inset(0% 0% 100% 0%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' },
    0,
  )
    .fromTo(
      partes.previsto,
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' },
      0.3,
    )
    .fromTo(
      partes.pagos,
      { scaleY: 0, transformOrigin: '50% 100%' },
      { scaleY: 1, duration: 1.1, ease: 'expo.out', stagger: 0.06 },
      0.4,
    )
    .fromTo(
      partes.rotulosMes,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: 'none', stagger: 0.06 },
      0.5,
    )
    .fromTo(
      partes.abertos,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'none', stagger: 0.06 },
      0.9,
    )
    // A entrada sobe os blocos do primeiro momento, não as linhas .gc-in de dentro: estas são do
    // pin, e uma entrada tardia (recarga no meio do pin) as traria de volta por cima.
    .fromTo(
      exigirItem(partes.momentos, 0, 'momento').children,
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
      partes.legenda,
      { clipPath: 'inset(0% 0% 100% 0%)', y: 13 },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        y: 0,
        duration: 1,
        ease: 'expo.out',
        clearProps: 'clipPath,transform',
      },
      0.8,
    )
  util.aoImprimir(() => tl.progress(1))
}

/* ---- Coreografia do pin ------------------------------------------------------------------ */

function coreografar({ gsap }: ContextoCena, tl: gsap.core.Timeline, partes: Partes): void {
  const medida = medirTraco(partes.traco)
  gsap.set(partes.traco, { strokeDasharray: 1, strokeDashoffset: 1 })
  gsap.set(partes.cobertos, { scaleY: 0, transformOrigin: '50% 0%' })
  gsap.set(partes.abertos, { y: TOPO - FAIXA })
  gsap.set(partes.custo, { scaleX: 0, transformOrigin: '0% 50%' })
  gsap.set([partes.custoRotulo, ...partes.rotulosCobranca, partes.chaveCoberto], {
    opacity: 0,
  })
  for (const momento of partes.momentos.slice(1)) {
    gsap.set(momento.querySelectorAll('.gc-in'), { yPercent: 110 })
  }
  TROCAS.forEach((t, i) => {
    const de = exigirItem(partes.momentos, i, 'momento')
    trocarMomento(tl, de, exigirItem(partes.momentos, i + 1, 'momento'), t)
  })
  completarMeses(tl, partes, medida, exigirItem(TROCAS, 0, 'troca') + 0.05)
  levarACobranca(tl, partes, medida, exigirItem(TROCAS, 1, 'troca') + 0.05)
  abrirCusto(tl, partes, exigirItem(TROCAS, 2, 'troca') + 0.15)
  cobrir(tl, partes)
}

/** O momento antigo sai por cima; o novo sobe por baixo, ~30% depois. */
function trocarMomento(tl: gsap.core.Timeline, de: HTMLElement, para: HTMLElement, t: number) {
  tl.fromTo(
    de.querySelectorAll('.gc-in'),
    { yPercent: 0 },
    { yPercent: -110, duration: 0.26, ease: 'power2.in', stagger: 0.04, immediateRender: false },
    t,
  ).fromTo(
    para.querySelectorAll('.gc-in'),
    { yPercent: 110 },
    { yPercent: 0, duration: 0.36, ease: 'power3.out', stagger: 0.05, immediateRender: false },
    t + 0.16,
  )
}

/**
 * Momento 2: o traço corre o patamar a velocidade constante e cada mês se completa em céu, de cima
 * para baixo, no instante em que o traço passa por ele.
 */
function completarMeses(tl: gsap.core.Timeline, partes: Partes, medida: Medida, t: number): void {
  tl.fromTo(
    partes.traco,
    { strokeDashoffset: 1 },
    { strokeDashoffset: 1 - medida.patamar, duration: PATAMAR_TRACO, immediateRender: false },
    t,
  ).fromTo(
    partes.chaveCoberto,
    { opacity: 0 },
    { opacity: 1, duration: 0.2, immediateRender: false },
    t,
  )
  partes.cobertos.forEach((coberto, i) => {
    const passa = t + (PATAMAR_TRACO * (i * PASSO_MES)) / FIM
    tl.fromTo(
      coberto,
      { scaleY: 0 },
      { scaleY: 1, duration: 0.16, ease: 'power2.out', immediateRender: false },
      passa,
    )
  })
}

/**
 * Momento 3: o traço dobra pela direita e volta pela faixa da cobrança; cada dívida desce do topo
 * do seu mês e encosta na faixa quando o traço chega embaixo dela. Os rótulos da faixa acendem
 * quando o traço já está nela.
 */
function levarACobranca(tl: gsap.core.Timeline, partes: Partes, medida: Medida, t: number): void {
  tl.fromTo(
    partes.traco,
    { strokeDashoffset: 1 - medida.patamar },
    { strokeDashoffset: 0, duration: VOLTA_TRACO, immediateRender: false },
    t,
  )
  partes.abertos.forEach((aberto, i) => {
    const chega = t + VOLTA_TRACO * medida.voltaNoMes(i)
    tl.fromTo(
      aberto,
      { y: TOPO - FAIXA },
      { y: 0, duration: QUEDA, ease: 'power2.inOut', immediateRender: false },
      chega - QUEDA,
    )
  })
  tl.fromTo(
    partes.rotulosCobranca,
    { opacity: 0 },
    { opacity: 1, duration: 0.2, stagger: 0.05, immediateRender: false },
    t + 0.35,
  )
}

/**
 * Momento 4: a faixa do 1%, no tamanho real, se abre da esquerda logo abaixo do patamar; o rótulo
 * acende na ponta.
 */
function abrirCusto(tl: gsap.core.Timeline, partes: Partes, t: number): void {
  tl.fromTo(
    partes.custo,
    { scaleX: 0 },
    { scaleX: 1, duration: 0.45, ease: 'power2.inOut', immediateRender: false },
    t,
  ).fromTo(
    partes.custoRotulo,
    { opacity: 0 },
    { opacity: 1, duration: 0.2, immediateRender: false },
    t + 0.3,
  )
}

/**
 * O traço do patamar engrossa e cresce até cobrir o palco de marinho. O recorte inicial sai da
 * geometria do SVG (a linha dos 100%, com a espessura do traço), a cada refresh (o pin tem
 * invalidateOnRefresh). A cauda, sem onUpdate, é pausa de propósito.
 */
function cobrir(tl: gsap.core.Timeline, partes: Partes): void {
  const medir = () => {
    const palco = partes.palco.getBoundingClientRect()
    const matriz = partes.grafico.getScreenCTM()
    if (!matriz) return 'inset(100% 0px 0px 0px)'
    const a = new DOMPoint(0, TOPO - TRACO / 2).matrixTransform(matriz)
    const b = new DOMPoint(FIM, TOPO + TRACO / 2).matrixTransform(matriz)
    const px = (v: number) => `${Math.max(0, v).toFixed(1)}px`
    return `inset(${px(a.y - palco.top)} ${px(palco.right - b.x)} ${px(palco.bottom - b.y)} ${px(
      a.x - palco.left,
    )})`
  }
  tl.fromTo(
    partes.cobertura,
    { clipPath: () => medir() },
    {
      clipPath: 'inset(0px 0px 0px 0px)',
      duration: COBRIR,
      ease: 'power3.inOut',
      immediateRender: false,
    },
    INICIO_COBRIR,
  ).to({}, { duration: CAUDA }, INICIO_COBRIR + COBRIR)
}

/** Impressão: o gráfico no estado final, como sem JS. */
function finalizar(gsap: ContextoCena['gsap'], partes: Partes): void {
  gsap.set(partes.traco, { strokeDashoffset: 0 })
  gsap.set(partes.cobertos, { scaleY: 1 })
  gsap.set(partes.abertos, { y: 0 })
  gsap.set(partes.custo, { scaleX: 1 })
  gsap.set([partes.custoRotulo, ...partes.rotulosCobranca, partes.chaveCoberto], {
    opacity: 1,
  })
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
