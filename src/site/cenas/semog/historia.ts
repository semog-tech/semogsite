import type { ContextoCena } from '@/site/core/tipos'

/**
 * Cena da história (A Semog), a cena-assinatura. Um pin só, com uma ideia: 35 anos como percurso.
 * Ao chegar, o eixo do tempo e a linha da costa se desenham, 1991 sobe por máscara e o Recife
 * aparece no esquema. Fixado, cada marco tem um patamar de leitura; entre um e outro, o traço
 * marinho anda pelo eixo até o ano do marco seguinte (espaçamento pelos anos reais, com folga
 * mínima entre vizinhos), o ano grande conta junto, o marco antigo sai por cima e o novo sobe por
 * baixo. Marco de Unidade: o nó entra no esquema, a rota marinho segue pela costa (ou pelo ramal
 * até Campina Grande) e os contadores rolam. O G20 abre a foto do palco por cortina; "Hoje" a
 * recolhe e mostra o mapa inteiro. No fim, o próprio traço do eixo abre para cima e para baixo
 * até cobrir a tela de marinho: a cena dos princípios começa nesse marinho, sem emenda.
 */
export function cenaHistoria(ctx: ContextoCena): void {
  const { root, util, ScrollTrigger } = ctx
  const partes = buscarPartes(root)
  root.classList.add('hist-pin')
  // A classe, o traço da rota e o ano são postos fora do GSAP: saem no desmonte (ou se quebrar).
  const anoInicial = partes.anoNumero.textContent
  util.registrarDesligamento(() => {
    root.classList.remove('hist-pin')
    partes.rotaPath.style.removeProperty('stroke-dasharray')
    partes.anoNumero.textContent = anoInicial
  })
  const rota = medirRota(partes)
  const tl = util.pinScrub(root, {
    alvo: partes.palco,
    distancia: `+=${Math.round(DURACAO * TELAS_POR_UNIDADE * 100)}%`,
    patamares: 'pausas',
  })
  const escrever = coreografar(ctx, tl, partes, rota)
  // O estado escrito (ano, rota) sai dos objetos animados a cada render da timeline e a cada
  // refresh: o ScrollTrigger renderiza a timeline em silêncio (sem onUpdate dos tweens) quando
  // recalcula, e o texto ficaria com o valor de outro passo.
  const sincronizar = () => {
    escrever()
    aplicarTema(root, tl.time() >= LIMIAR_TEMA ? 'marinho' : 'claro')
  }
  tl.eventCallback('onUpdate', sincronizar)
  ScrollTrigger.addEventListener('refresh', sincronizar)
  util.registrarDesligamento(() => ScrollTrigger.removeEventListener('refresh', sincronizar))
  entrar(ctx, partes, rota)
  util.aoImprimir(() => aplicarTema(root, 'claro'))
}

/* ---- Ritmo ------------------------------------------------------------------------------
   A timeline do pin é medida em "unidades": cada marco ocupa uma unidade (transição + patamar
   de leitura) e uma unidade vale 0,72 tela de rolagem. */

/** Posição de cada ano no eixo (0 a 1): proporcional aos anos, folga mínima de 7,6%. */
const TICKS = [0, 0.217, 0.314, 0.676, 0.772, 0.848, 0.924, 1]
const TELAS_POR_UNIDADE = 0.72
/** Patamar do 1991 antes do primeiro passo (ele já entrou antes do pin). */
const PATAMAR_INICIAL = 0.55
const PASSO = 1
const TRANSICAO = 0.42
const COBRIR = 0.75
const MARCOS = 10
const INICIO_COBRIR = PATAMAR_INICIAL + (MARCOS - 1) * PASSO
/**
 * Uma tela de rolagem depois da cobertura, com o palco todo marinho. Os princípios (marinho)
 * sobem por cima dele desde 0,35 tela antes do fim da cobertura (margem negativa de 135svh no
 * CSS): o Retidão entra enquanto o marinho ainda fecha em cima, e nenhum quadro fica só de cor.
 */
const CAUDA = 1 / TELAS_POR_UNIDADE
const DURACAO = INICIO_COBRIR + COBRIR + CAUDA
/** Com 75% da cobertura (power3.inOut) a borda de cima já passou da linha do cabeçalho. */
const LIMIAR_TEMA = INICIO_COBRIR + COBRIR * 0.75

/** Ordem dos contadores: a Unidade da vez e quantos estados ela soma. */
const UNIDADES = ['recife', 'joao-pessoa', 'belem', 'campina-grande'] as const
type IdUnidade = (typeof UNIDADES)[number]
/** As Unidades que a rota alcança pela costa; Campina Grande chega pelo ramal. */
type IdCosteira = Exclude<IdUnidade, 'campina-grande'>
const ESTADO_DA_UNIDADE: Record<IdUnidade, number> = {
  recife: 0,
  'joao-pessoa': 1,
  belem: 2,
  'campina-grande': 2,
}

function ehUnidade(id: string): id is IdUnidade {
  return UNIDADES.some((unidade) => unidade === id)
}

type Partes = ReturnType<typeof buscarPartes>

function buscarPartes(root: HTMLElement) {
  const achar = (seletor: string): HTMLElement => {
    const el = root.querySelector(seletor)
    if (!(el instanceof HTMLElement)) throw new Error(`[cena historia] falta ${seletor}.`)
    return el
  }
  const geometria = (seletor: string): SVGGeometryElement => {
    const el = root.querySelector(seletor)
    if (!(el instanceof SVGGeometryElement)) throw new Error(`[cena historia] falta ${seletor}.`)
    return el
  }
  const marcos = Array.from(root.querySelectorAll<HTMLElement>('.hist-marco'))
  if (marcos.length !== MARCOS) throw new Error(`[cena historia] esperava ${MARCOS} marcos.`)
  return {
    palco: achar('.hist-palco'),
    titulo: achar('.hist-titulo'),
    ano: achar('.hist-ano'),
    anoNumero: achar('.hist-ano-numero'),
    anoHoje: achar('.hist-ano-hoje'),
    marcos,
    linha: achar('.hist-eixo-linha'),
    trilho: achar('.hist-eixo-trilho'),
    traco: achar('.hist-eixo-traco'),
    ticks: Array.from(root.querySelectorAll<HTMLElement>('.hist-ticks li')),
    costa: geometria('.hist-costa'),
    rotaPath: geometria('.hist-rota'),
    ramal: geometria('.hist-ramal'),
    foto: achar('.hist-foto .moldura'),
    fotoImg: achar('.hist-foto img'),
    esquema: achar('.hist-esquema > span'),
    cobertura: achar('.hist-cobertura'),
    contadores: achar('.hist-contadores'),
  }
}

/* ---- Rota pela costa ------------------------------------------------------------------- */

type Rota = {
  total: number
  recife: number
  /** Ponta norte da rota a cada Unidade costeira alcançada. */
  alcance: Record<IdCosteira, number>
  desenhar: (a: number) => void
}

/**
 * A rota é a própria linha da costa, desenhada do Recife para o norte: o trecho visível vai de
 * `a` até o Recife. Mede onde cada Unidade costeira cai no comprimento do path.
 */
function medirRota(partes: Partes): Rota {
  const path = partes.rotaPath
  const total = path.getTotalLength()
  const comprimentoDo = (id: IdCosteira): number => {
    const no = partes.palco.querySelector(`.hist-no[data-no="${id}"]`)
    if (!(no instanceof SVGRectElement)) throw new Error(`[cena historia] falta o nó ${id}.`)
    const cx = no.x.baseVal.value + no.width.baseVal.value / 2
    const cy = no.y.baseVal.value + no.height.baseVal.value / 2
    let melhor = 0
    let menor = Number.POSITIVE_INFINITY
    for (let i = 0; i <= 400; i += 1) {
      const l = (total * i) / 400
      const p = path.getPointAtLength(l)
      const d = (p.x - cx) ** 2 + (p.y - cy) ** 2
      if (d < menor) [menor, melhor] = [d, l]
    }
    return melhor
  }
  const recife = comprimentoDo('recife')
  return {
    total,
    recife,
    alcance: {
      recife,
      'joao-pessoa': comprimentoDo('joao-pessoa'),
      belem: comprimentoDo('belem'),
    },
    desenhar(a) {
      path.style.strokeDasharray = `0 ${a} ${Math.max(0, recife - a)} ${total}`
    },
  }
}

/* ---- Entrada (antes do pin) ------------------------------------------------------------ */

/**
 * Toca uma vez quando a cena chega: eixo e costa se desenham, 1991, o primeiro marco e os
 * contadores sobem por máscara, o Recife entra no esquema.
 */
function entrar(ctx: ContextoCena, partes: Partes, rota: Rota): void {
  const { gsap, root, util } = ctx
  util.revelarTexto(partes.titulo, { gatilho: root, inicio: 'top 72%' })
  const costa = partes.costa.getTotalLength()
  const tl = gsap.timeline({
    scrollTrigger: { trigger: root, start: 'top 72%', toggleActions: 'play none none none' },
  })
  tl.fromTo(
    partes.trilho,
    { scaleX: 0 },
    { scaleX: 1, duration: 1.3, ease: 'expo.inOut' },
    0,
  ).fromTo(
    partes.costa,
    { strokeDasharray: costa, strokeDashoffset: costa },
    { strokeDashoffset: 0, duration: 1.8, ease: 'expo.inOut' },
    0.1,
  )
  const primeiro = partes.marcos[0]
  const subirem = [
    partes.ano,
    primeiro.querySelector('.hist-marco-titulo'),
    primeiro.querySelector('.hist-marco-texto'),
    ...Array.from(partes.contadores.children),
  ]
  tl.fromTo(
    subirem,
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
  entrarUnidade(tl, partes, 'recife', [0.9, 0.5])
  acenderTick(tl, partes.ticks[0], [1.1, 0.6])
  util.aoImprimir(() => tl.progress(1))
  rota.desenhar(rota.recife)
}

/* ---- Coreografia do pin ---------------------------------------------------------------- */

/** Monta os passos do pin e devolve quem escreve o ano e a rota a partir do estado animado. */
function coreografar(
  ctx: ContextoCena,
  tl: gsap.core.Timeline,
  partes: Partes,
  rota: Rota,
): () => void {
  const { gsap, conteudo } = ctx
  const dados = conteudo.aSemog.historia.marcos
  const tickDe = (i: number) => Number(partes.marcos[i].dataset.tick)
  for (const marco of partes.marcos.slice(1)) {
    gsap.set(marco.querySelectorAll('.hist-in'), { yPercent: 110 })
  }
  gsap.set(partes.foto, { clipPath: 'inset(100% 0% 0% 0%)' })
  gsap.set(partes.anoHoje, { yPercent: 110 })
  /** Ano grande e ponta norte da rota: animados aqui, escritos por `escrever`. */
  const ano = { valor: dados[0].ano }
  const ponta = { a: rota.recife }
  const escrever = () => {
    const texto = String(Math.round(ano.valor))
    if (partes.anoNumero.textContent !== texto) partes.anoNumero.textContent = texto
    rota.desenhar(ponta.a)
  }

  for (let i = 1; i < MARCOS; i += 1) {
    const t = PATAMAR_INICIAL + (i - 1) * PASSO
    trocarMarco(tl, partes.marcos[i - 1], partes.marcos[i], t)
    andarEixo(tl, partes, [tickDe(i - 1), tickDe(i)], t)
    if (dados[i].data === dados[MARCOS - 1].data) {
      trocarParaHoje(tl, partes, t)
    } else if (dados[i].ano !== dados[i - 1].ano) {
      tl.fromTo(
        ano,
        { valor: dados[i - 1].ano },
        {
          valor: dados[i].ano,
          duration: TRANSICAO,
          ease: 'power2.inOut',
          immediateRender: false,
        },
        t,
      )
    }
    const marco = dados[i]
    if ('unidade' in marco) chegarUnidade(tl, partes, { unidade: marco.unidade, ponta, rota }, t)
    if ('foto' in partes.marcos[i].dataset) abrirFoto(tl, partes, t)
    if ('foto' in partes.marcos[i - 1].dataset) fecharFoto(tl, partes, t)
  }
  cobrir(tl, partes)
  return escrever
}

/** O marco antigo sai por cima; o novo sobe por baixo, ~30% depois. */
function trocarMarco(tl: gsap.core.Timeline, de: HTMLElement, para: HTMLElement, t: number): void {
  tl.fromTo(
    de.querySelectorAll('.hist-in'),
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
    para.querySelectorAll('.hist-in'),
    { yPercent: 110 },
    { yPercent: 0, duration: 0.36, ease: 'power3.out', stagger: 0.05, immediateRender: false },
    t + 0.16,
  )
}

/** O traço marinho anda até o tick do marco; o tick e o ano dele acendem ao chegar. */
function andarEixo(
  tl: gsap.core.Timeline,
  partes: Partes,
  [de, para]: [number, number],
  t: number,
): void {
  if (de === para) return
  tl.fromTo(
    partes.traco,
    { scaleX: TICKS[de] },
    { scaleX: TICKS[para], duration: TRANSICAO, ease: 'power2.inOut', immediateRender: false },
    t,
  )
  acenderTick(tl, partes.ticks[para], [t + TRANSICAO * 0.85, 0.16])
}

function acenderTick(
  tl: gsap.core.Timeline,
  tick: HTMLElement,
  [t, duracao]: [inicio: number, duracao: number],
): void {
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

/** Nó (quadrado < 40px: back.out) e rótulo da cidade. */
function entrarUnidade(
  tl: gsap.core.Timeline,
  partes: Partes,
  id: IdUnidade,
  [t, duracao]: [inicio: number, duracao: number],
): void {
  const no = partes.palco.querySelector(`.hist-no[data-no="${id}"]`)
  const rotulo = partes.palco.querySelector(`[data-cidade="${id}"] .hist-cidade-in`)
  if (!no || !rotulo) throw new Error(`[cena historia] Unidade sem nó ou rótulo: ${id}`)
  tl.fromTo(
    no,
    { scale: 0, transformOrigin: '50% 50%' },
    { scale: 1, duration: duracao * 0.7, ease: 'back.out(2.2)' },
    t,
  ).fromTo(
    rotulo,
    { yPercent: 110 },
    { yPercent: 0, duration: duracao, ease: 'power3.out' },
    t + duracao * 0.25,
  )
}

type Chegada = { unidade: string; ponta: { a: number }; rota: Rota }

/**
 * Marco de Unidade: a rota cresce até ela (ou o ramal até Campina Grande), o nó e o rótulo
 * entram, e os contadores rolam para o novo total.
 */
function chegarUnidade(
  tl: gsap.core.Timeline,
  partes: Partes,
  { unidade, ponta, rota }: Chegada,
  t: number,
): void {
  if (!ehUnidade(unidade)) throw new Error(`[cena historia] Unidade desconhecida: ${unidade}`)
  const indice = UNIDADES.indexOf(unidade)
  const anterior = UNIDADES[indice - 1]
  if (anterior === undefined)
    throw new Error(`[cena historia] ${unidade} não chega depois de ninguém.`)
  if (unidade !== 'campina-grande') {
    if (anterior === 'campina-grande') {
      throw new Error(`[cena historia] a rota até ${unidade} sairia do ramal.`)
    }
    tl.fromTo(
      ponta,
      { a: rota.alcance[anterior] },
      {
        a: rota.alcance[unidade],
        duration: TRANSICAO,
        ease: 'power2.inOut',
        immediateRender: false,
      },
      t,
    )
  } else {
    const comprimento = partes.ramal.getTotalLength()
    tl.fromTo(
      partes.ramal,
      { strokeDasharray: comprimento, strokeDashoffset: comprimento },
      { strokeDashoffset: 0, duration: TRANSICAO * 0.8, ease: 'power2.inOut' },
      t,
    )
  }
  entrarUnidade(tl, partes, unidade, [t + TRANSICAO * 0.7, 0.3])
  rolar(tl, partes, ['unidades', indice, 4], t + TRANSICAO * 0.6)
  const estado = ESTADO_DA_UNIDADE[unidade]
  if (estado !== ESTADO_DA_UNIDADE[anterior]) {
    rolar(tl, partes, ['estados', estado, 3], t + TRANSICAO * 0.6)
    rolar(tl, partes, ['ufs', estado, 3], t + TRANSICAO * 0.6)
  }
}

/** Rolo de números: a coluna sobe uma linha. */
function rolar(
  tl: gsap.core.Timeline,
  partes: Partes,
  [nome, para, linhas]: [nome: string, para: number, linhas: number],
  t: number,
): void {
  const rolo = partes.contadores.querySelector(`[data-rolo="${nome}"]`)
  if (!rolo) throw new Error(`[cena historia] falta o rolo ${nome}.`)
  tl.fromTo(
    rolo,
    { yPercent: (-100 * (para - 1)) / linhas },
    {
      yPercent: (-100 * para) / linhas,
      duration: 0.3,
      ease: 'power3.inOut',
      immediateRender: false,
    },
    t,
  )
}

/** O ano sai por cima e "Hoje" sobe no lugar. */
function trocarParaHoje(tl: gsap.core.Timeline, partes: Partes, t: number): void {
  tl.fromTo(
    partes.anoNumero,
    { yPercent: 0 },
    { yPercent: -110, duration: 0.26, ease: 'power2.in', immediateRender: false },
    t,
  ).fromTo(
    partes.anoHoje,
    { yPercent: 110 },
    { yPercent: 0, duration: 0.36, ease: 'power3.out', immediateRender: false },
    t + 0.16,
  )
}

/** Cortina de baixo para cima; a foto assenta do zoom enquanto abre. */
function abrirFoto(tl: gsap.core.Timeline, partes: Partes, t: number): void {
  tl.fromTo(
    partes.foto,
    { clipPath: 'inset(100% 0% 0% 0%)' },
    {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 0.5,
      ease: 'power3.inOut',
      immediateRender: false,
    },
    t + 0.1,
  )
    .fromTo(
      partes.fotoImg,
      { scale: 1.3 },
      // O zoom termina de assentar dentro do patamar: é respiro, não troca (o toque para ali).
      { scale: 1, duration: 0.75, ease: 'power2.out', immediateRender: false, data: 'respiro' },
      t + 0.14,
    )
    .fromTo(
      partes.esquema,
      { yPercent: 0 },
      { yPercent: 110, duration: 0.2, ease: 'power2.in', immediateRender: false },
      t,
    )
}

/** A mesma cortina continua subindo e recolhe a foto: o mapa inteiro volta. */
function fecharFoto(tl: gsap.core.Timeline, partes: Partes, t: number): void {
  tl.fromTo(
    partes.foto,
    { clipPath: 'inset(0% 0% 0% 0%)' },
    {
      clipPath: 'inset(0% 0% 100% 0%)',
      duration: 0.4,
      ease: 'power3.inOut',
      immediateRender: false,
    },
    t,
  ).fromTo(
    partes.esquema,
    { yPercent: 110 },
    { yPercent: 0, duration: 0.3, ease: 'power3.out', immediateRender: false },
    t + 0.3,
  )
}

/**
 * O traço do eixo abre até cobrir o palco: começa exatamente no retângulo da linha (medido a cada
 * refresh; o pin tem invalidateOnRefresh) e termina na tela inteira.
 */
function cobrir(tl: gsap.core.Timeline, partes: Partes): void {
  const inicio = () => {
    const palco = partes.palco.getBoundingClientRect()
    const linha = partes.linha.getBoundingClientRect()
    const px = (v: number) => `${Math.max(0, v).toFixed(1)}px`
    return `inset(${px(linha.top - palco.top)} ${px(palco.right - linha.right)} ${px(
      palco.bottom - linha.bottom,
    )} ${px(linha.left - palco.left)})`
  }
  tl.fromTo(
    partes.cobertura,
    { clipPath: inicio },
    {
      clipPath: 'inset(0px 0px 0px 0px)',
      duration: COBRIR,
      ease: 'power3.inOut',
      immediateRender: false,
    },
    INICIO_COBRIR,
  ).to({}, { duration: DURACAO - INICIO_COBRIR - COBRIR })
}

/* ---- Tema ------------------------------------------------------------------------------ */

/**
 * Coberta de marinho, a cena passa a se declarar marinho. O cabeçalho é atualizado aqui também:
 * o scrub continua depois que a rolagem para, e o core só relê o tema quando há rolagem.
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
