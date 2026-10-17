import type { ContextoCena } from '@/site/core/tipos'

/**
 * Cena da mesa do síndico (Gestão), a cena-assinatura. Um pin só, com uma ideia: o que pesa na
 * mesa do síndico sai dela e vai para as frentes da Semog, e na mesa fica o que é dele, decidir.
 * Ao chegar, as tarefas caem na mesa em cascata, a espinha lavanda das frentes desce e o primeiro
 * momento sobe por máscara. Fixado, cada momento tem um patamar de leitura. Entre eles, um traço
 * só, de ponta reta, desce pela espinha até o nó da frente da vez; o nó acende, o nome ganha peso
 * e as tarefas daquela frente saem da pilha e pousam ali, uma depois da outra. Feitas as cinco,
 * "decidir" acende em céu claro e cresce até cobrir o palco: a cena seguinte sobe nesse céu, sem
 * emenda. O estado do desenho sai de uma variável só, q (de 0, a mesa cheia, a 5, as cinco frentes
 * feitas), que a timeline do pin anima; posições são medidas a cada refresh.
 */
export function cenaMesa(ctx: ContextoCena): void {
  const { root, util, gsap, ScrollTrigger } = ctx
  const partes = buscarPartes(root)
  root.classList.add('gme-pin')
  // A classe e os estilos que o desenho escreve fora do GSAP saem no desmonte (ou se quebrar).
  util.registrarDesligamento(() => desfazerDesenho(root, partes))
  const desenho = criarDesenho(partes)
  const tl = util.pinScrub(root, {
    alvo: partes.palco,
    distancia: `+=${Math.round(DURACAO * TELAS_POR_UNIDADE * 100)}%`,
    patamares: 'pausas',
  })
  coreografar(ctx, tl, partes, desenho)
  const tema = () => aplicarTema(root, tl.time() >= LIMIAR_TEMA ? 'gelo' : 'claro')
  tl.eventCallback('onUpdate', () => {
    desenho.pintar()
    tema()
  })
  // O ScrollTrigger renderiza em silêncio quando recalcula: a geometria e o tema saem de novo.
  const remedir = () => {
    desenho.remedir()
    tema()
  }
  ScrollTrigger.addEventListener('refresh', remedir)
  util.registrarDesligamento(() => ScrollTrigger.removeEventListener('refresh', remedir))
  entrar(ctx, partes)
  util.aoImprimir(() => {
    aplicarTema(root, 'claro')
    desenho.estado.q = FRENTES
    desenho.pintar()
    gsap.set(partes.realce, { scaleX: 1 })
    gsap.set(partes.vagas, { opacity: 1 })
  })
}

/* ---- Ritmo ------------------------------------------------------------------------------
   A timeline do pin é medida em "unidades": cada momento ocupa uma (transição + patamar de
   leitura) e uma unidade vale 0,8 tela de rolagem. */

const TELAS_POR_UNIDADE = 0.8
const PATAMAR_INICIAL = 0.6
const PASSO = 1
const MOMENTOS = 7
const FRENTES = 5
/** Início de cada troca de momento (1 a 6). */
const TROCAS = Array.from({ length: MOMENTOS - 1 }, (_, i) => PATAMAR_INICIAL + i * PASSO)
/** Uma frente leva PERCURSO na timeline; "decidir" acende em ACENDER. */
const PERCURSO = 0.6
const ACENDER = 0.4
/**
 * Dentro de uma frente (q de i a i + 1): o traço chega ao nó em CHEGAR; as tarefas pousam depois,
 * espalhadas até 1 - FOLGA, e cada uma voa por VOO.
 */
const CHEGAR = 0.3
const FOLGA = 0.06
const VOO = 0.28
const COBRIR = 0.55
const INICIO_COBRIR = PATAMAR_INICIAL + (MOMENTOS - 1) * PASSO
/**
 * A cena seguinte sobe por cima dos últimos SOBREPOSICAO_TELAS do pin (margem negativa de 45svh
 * em atende.css), a partir de 30% da cobertura: quando o céu fecha a tela, o título dela já está
 * no terço de baixo. Os dois números andam juntos.
 */
const SOBREPOSICAO_TELAS = 0.45
const CAUDA = SOBREPOSICAO_TELAS / TELAS_POR_UNIDADE - 0.7 * COBRIR
const DURACAO = INICIO_COBRIR + COBRIR + CAUDA
const LIMIAR_TEMA = INICIO_COBRIR + COBRIR * 0.8

type Partes = ReturnType<typeof buscarPartes>
type Desenho = ReturnType<typeof criarDesenho>
type Deslocamento = { x: number; y: number }

function buscarPartes(root: HTMLElement) {
  const achar = (seletor: string): HTMLElement => {
    const el = root.querySelector(seletor)
    if (!(el instanceof HTMLElement)) throw new Error(`[cena mesa-do-sindico] falta ${seletor}.`)
    return el
  }
  const todos = (seletor: string): HTMLElement[] =>
    Array.from(root.querySelectorAll(seletor)).filter((el) => el instanceof HTMLElement)
  const linhas = todos('.gme-frente')
  const cartoes = todos('.gme-cartao')
  const momentos = todos('.gme-momento')
  // A vaga de cada tarefa, pela ordem dos cartões (a pilha vem misturada).
  const vagas = cartoes.map((c) => achar(`.gme-vaga[data-tarefa="${c.dataset.tarefa}"]`))
  const frenteDe = cartoes.map((c) => linhas.findIndex((l) => l.contains(c)))
  if (linhas.length !== FRENTES || momentos.length !== MOMENTOS || frenteDe.includes(-1)) {
    throw new Error(`[cena mesa-do-sindico] esperava ${FRENTES} frentes e ${MOMENTOS} momentos.`)
  }
  return {
    palco: achar('.gme-palco'),
    cobertura: achar('.gme-cobertura'),
    titulo: achar('.gme-titulo'),
    frentes: achar('.gme-frentes'),
    espinha: achar('.gme-espinha'),
    decidir: achar('.gme-decidir'),
    realce: achar('.gme-realce'),
    rotulos: todos('.gme-rotulo'),
    nomes: todos('.gme-frente-nome'),
    nos: todos('.gme-no'),
    linhas,
    cartoes,
    vagas,
    frenteDe,
    momentos,
  }
}

/** O que o desenho escreve direto no estilo (fora do GSAP) volta ao HTML estático. */
function desfazerDesenho(root: HTMLElement, partes: Partes): void {
  root.classList.remove('gme-pin')
  for (const nome of ['--gme-espinha-topo', '--gme-espinha-altura', '--gme-p']) {
    partes.espinha.style.removeProperty(nome)
  }
  for (const no of partes.nos) no.style.removeProperty('--gme-acesa')
  for (const nome of partes.nomes) nome.style.removeProperty('font-variation-settings')
  for (const cartao of partes.cartoes) cartao.style.removeProperty('transform')
}

/* ---- Desenho: o estado sai de q -------------------------------------------------------- */

/**
 * Quando cada tarefa pousa (em q): espalhadas pela frente depois de o traço chegar ao nó, na ordem
 * em que aparecem na frente.
 */
function calcularPousos(frenteDe: number[]): number[] {
  return frenteDe.map((i, n) => {
    const irmas = frenteDe.filter((f) => f === i).length
    const ordemNaFrente = frenteDe.slice(0, n).filter((f) => f === i).length
    const faixa = 1 - CHEGAR - FOLGA
    return i + CHEGAR + (faixa * (ordemNaFrente + 1)) / irmas
  })
}

function exigirItem<T>(lista: readonly T[], i: number, nome: string): T {
  const item = lista[i]
  if (item === undefined) throw new Error(`[cena mesa-do-sindico] falta ${nome} ${i}.`)
  return item
}

/**
 * Mede a espinha (do topo da primeira frente ao nó da última) e onde cada nó cai nela, e o
 * deslocamento de cada tarefa (sem o transform de agora) até a sua vaga na pilha.
 */
function medir(partes: Partes, atual: Deslocamento[]) {
  const caixa = partes.frentes.getBoundingClientRect()
  const centros = partes.nos.map((no) => {
    const r = no.getBoundingClientRect()
    return r.top + r.height / 2 - caixa.top
  })
  const topo = exigirItem(partes.linhas, 0, 'frente').getBoundingClientRect().top - caixa.top
  const altura = Math.max(1, exigirItem(centros, centros.length - 1, 'nó') - topo)
  const ateVaga = partes.cartoes.map((cartao, n): Deslocamento => {
    const base = cartao.getBoundingClientRect()
    const vaga = exigirItem(partes.vagas, n, 'vaga').getBoundingClientRect()
    const agora = exigirItem(atual, n, 'tarefa')
    return { x: vaga.left - (base.left - agora.x), y: vaga.top - (base.top - agora.y) }
  })
  return { topo, altura, nos: centros.map((c) => (c - topo) / altura), ateVaga }
}

function criarDesenho(partes: Partes) {
  const estado = { q: 0 }
  const atual: Deslocamento[] = partes.cartoes.map(() => ({ x: 0, y: 0 }))
  const pousos = calcularPousos(partes.frenteDe)
  let medida = medir(partes, atual)
  aplicarEspinha()

  function aplicarEspinha() {
    partes.espinha.style.setProperty('--gme-espinha-topo', `${medida.topo.toFixed(1)}px`)
    partes.espinha.style.setProperty('--gme-espinha-altura', `${medida.altura.toFixed(1)}px`)
  }

  /** Fração da espinha desenhada em q: dentro da frente i, do nó anterior ao nó dela. */
  function alcance(q: number): number {
    if (q >= FRENTES) return 1
    const i = Math.max(0, Math.floor(q))
    const de = i === 0 ? 0 : exigirItem(medida.nos, i - 1, 'nó')
    const f = Math.min(1, Math.max(0, (q - i) / CHEGAR))
    return de + (exigirItem(medida.nos, i, 'nó') - de) * vooSuave(f)
  }

  function pintar() {
    const q = estado.q
    partes.espinha.style.setProperty('--gme-p', alcance(q).toFixed(4))
    partes.nos.forEach((no, i) => {
      const f = Math.min(1, Math.max(0, (q - i - CHEGAR * 0.85) / 0.12))
      no.style.setProperty('--gme-acesa', f.toFixed(3))
      exigirItem(partes.nomes, i, 'nome').style.fontVariationSettings =
        `"wght" ${Math.round(300 + 300 * f)}`
    })
    partes.cartoes.forEach((cartao, n) => {
      const pousa = exigirItem(pousos, n, 'pouso')
      const sai = Math.max(Math.floor(pousa) + CHEGAR * 0.6, pousa - VOO)
      const e = vooSuave(Math.min(1, Math.max(0, (q - sai) / (pousa - sai))))
      const vaga = exigirItem(medida.ateVaga, n, 'vaga')
      const x = vaga.x * (1 - e)
      const y = vaga.y * (1 - e)
      atual[n] = { x, y }
      cartao.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`
    })
  }

  function remedir() {
    medida = medir(partes, atual)
    aplicarEspinha()
    pintar()
  }

  pintar()
  return { estado, pintar, remedir }
}

/** power2.inOut, para o voo das tarefas e a descida do traço. */
function vooSuave(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

/* ---- Entrada (antes do pin) ------------------------------------------------------------ */

type Cair = [gsap.TweenTarget, gsap.TweenVars, gsap.TweenVars, number]

/** A vaga e a tarefa caem juntas: o contorno vazio não aparece antes da hora. */
function cair(alvos: Element[]): Cair {
  return [
    alvos,
    { clipPath: 'inset(0% 0% 100% 0%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.out', stagger: 0.035 },
    0.15,
  ]
}

/**
 * Toca uma vez quando a cena chega: os rótulos sobem, as tarefas caem na mesa em cascata (na
 * ordem da pilha), a espinha lavanda desce, os nós e os nomes das frentes sobem e o primeiro
 * momento sobe por máscara.
 */
function entrar(ctx: ContextoCena, partes: Partes): void {
  const { gsap, root, util } = ctx
  util.revelarTexto(partes.titulo, { gatilho: root, inicio: 'top 72%' })
  const pares = partes.vagas
    .map((vaga, n) => ({ vaga, cartao: exigirItem(partes.cartoes, n, 'tarefa') }))
    .sort((a, b) => ordem(a.vaga) - ordem(b.vaga))
  const tl = gsap.timeline({
    scrollTrigger: { trigger: root, start: 'top 72%', toggleActions: 'play none none none' },
  })
  tl.fromTo(
    partes.rotulos,
    { clipPath: 'inset(0% 0% 100% 0%)', y: 13 },
    { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1, ease: 'expo.out', stagger: 0.1 },
    0,
  )
    .fromTo(...cair([...pares.map((p) => p.cartao), partes.decidir]))
    .fromTo(...cair(pares.map((p) => p.vaga)))
    .fromTo(
      partes.espinha,
      { scaleY: 0, transformOrigin: '50% 0%' },
      { scaleY: 1, duration: 1.3, ease: 'expo.inOut' },
      0.3,
    )
    .fromTo(
      partes.nos,
      { scale: 0 },
      { scale: 1, duration: 0.6, ease: 'back.out(2)', stagger: 0.12 },
      0.45,
    )
    .fromTo(
      partes.nomes,
      { clipPath: 'inset(0% 0% 100% 0%)', y: 13 },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        y: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.08,
        clearProps: 'clipPath,transform',
      },
      0.45,
    )
    // A entrada sobe os blocos do primeiro momento, não as linhas .gme-in de dentro: estas são
    // do pin, e uma entrada tardia (recarga no meio do pin) as traria de volta por cima.
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
  util.aoImprimir(() => tl.progress(1))
}

/** Posição da vaga na pilha (ordem do DOM). */
function ordem(vaga: HTMLElement): number {
  const pilha = vaga.parentElement
  return pilha ? Array.prototype.indexOf.call(pilha.children, vaga) : 0
}

/* ---- Coreografia do pin ------------------------------------------------------------------ */

function coreografar(
  { gsap }: ContextoCena,
  tl: gsap.core.Timeline,
  partes: Partes,
  desenho: Desenho,
): void {
  gsap.set(partes.realce, { scaleX: 0 })
  for (const momento of partes.momentos.slice(1)) {
    gsap.set(momento.querySelectorAll('.gme-in'), { yPercent: 110 })
  }
  TROCAS.forEach((t, i) => {
    const de = exigirItem(partes.momentos, i, 'momento')
    trocarMomento(tl, de, exigirItem(partes.momentos, i + 1, 'momento'), t)
  })
  for (let i = 0; i < FRENTES; i += 1) {
    tl.fromTo(
      desenho.estado,
      { q: i },
      { q: i + 1, duration: PERCURSO, ease: 'none', immediateRender: false },
      exigirItem(TROCAS, i, 'troca') + 0.05,
    )
  }
  acender(tl, partes, exigirItem(TROCAS, FRENTES, 'troca') + 0.1)
  cobrir(tl, partes)
}

/** O momento antigo sai por cima; o novo sobe por baixo, ~30% depois. */
function trocarMomento(tl: gsap.core.Timeline, de: HTMLElement, para: HTMLElement, t: number) {
  tl.fromTo(
    de.querySelectorAll('.gme-in'),
    { yPercent: 0 },
    { yPercent: -110, duration: 0.26, ease: 'power2.in', stagger: 0.04, immediateRender: false },
    t,
  ).fromTo(
    para.querySelectorAll('.gme-in'),
    { yPercent: 110 },
    { yPercent: 0, duration: 0.36, ease: 'power3.out', stagger: 0.05, immediateRender: false },
    t + 0.16,
  )
}

/**
 * Último momento: "decidir" acende em céu claro (o realce cresce da esquerda) e as vagas vazias se
 * apagam um pouco; a mesa fica só com ele.
 */
function acender(tl: gsap.core.Timeline, partes: Partes, t: number): void {
  tl.fromTo(
    partes.realce,
    { scaleX: 0 },
    { scaleX: 1, duration: ACENDER, ease: 'power2.inOut', immediateRender: false },
    t,
  ).fromTo(
    partes.vagas,
    { opacity: 1 },
    { opacity: 0.35, duration: ACENDER, ease: 'none', immediateRender: false },
    t,
  )
}

/**
 * "decidir" cresce até cobrir o palco de céu claro. O recorte inicial é a caixa dele, medida a
 * cada refresh (o pin tem invalidateOnRefresh). A cauda, sem onUpdate, é pausa de propósito.
 */
function cobrir(tl: gsap.core.Timeline, partes: Partes): void {
  const medirRecorte = () => {
    const palco = partes.palco.getBoundingClientRect()
    const caixa = partes.decidir.getBoundingClientRect()
    const px = (v: number) => `${Math.max(0, v).toFixed(1)}px`
    return `inset(${px(caixa.top - palco.top)} ${px(palco.right - caixa.right)} ${px(
      palco.bottom - caixa.bottom,
    )} ${px(caixa.left - palco.left)})`
  }
  tl.fromTo(
    partes.cobertura,
    { clipPath: () => medirRecorte() },
    {
      clipPath: 'inset(0px 0px 0px 0px)',
      duration: COBRIR,
      ease: 'power3.inOut',
      immediateRender: false,
    },
    INICIO_COBRIR,
  ).to({}, { duration: CAUDA }, INICIO_COBRIR + COBRIR)
}

/* ---- Tema --------------------------------------------------------------------------------- */

/**
 * Coberta de céu claro, a cena passa a se declarar gelo (o tema da cena seguinte). O cabeçalho é
 * atualizado aqui também: o scrub continua depois que a rolagem para, e o core só relê o tema
 * quando há rolagem.
 */
function aplicarTema(root: HTMLElement, tema: 'claro' | 'gelo'): void {
  if (root.dataset.tema === tema) return
  root.dataset.tema = tema
  const cabecalho = document.querySelector('[data-cabecalho]')
  if (!(cabecalho instanceof HTMLElement)) return
  const linha = cabecalho.getBoundingClientRect().bottom + 1
  const caixa = root.getBoundingClientRect()
  if (caixa.top <= linha && caixa.bottom > linha) cabecalho.dataset.tema = tema
}
