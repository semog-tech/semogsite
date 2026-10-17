import type { ContextoCena } from '@/site/core/tipos'
import type { Pintura } from '@/site/core/util'

/**
 * Cena dos condomínios. Uma barra por condomínio sob gestão (o módulo do pattern do rebrand,
 * retângulo 1:2 de canto reto). As barras chegam espalhadas em lavanda, voam e formam o número
 * em marinho, desfazem o número na grade do pattern (o horizonte de prédios) enquanto os outros
 * números contam, e a barra mais alta cresce até cobrir a tela em marinho: os pilares começam
 * nesse marinho, sem emenda. Canvas 2D: um retângulo por barra a cada quadro, só com a cena
 * visível.
 */

type Estado = { chegada: number; numero: number; grade: number; cobrir: number }
/** Centros, em px CSS. */
type Pose = { x: Float32Array; y: Float32Array; w: number; h: number }
type Caixa = { x: number; y: number; w: number; h: number }
type Rgb = [number, number, number]
type Ponto = [number, number]
type Tinta = { dados: Uint8ClampedArray; w: number; h: number }
type Eases = ReturnType<typeof criarEases>
type Cores = { solta: Rgb; numero: Rgb; tons: Rgb[] }
type Cena = {
  solta: Pose
  numero: Pose
  grade: Pose
  /** Índice em `cores.tons` de cada barra na grade. */
  tom: Uint8Array
  /** 0 a 1, fixa por barra. */
  semente: Float32Array
  atrasoNumero: Float32Array
  atrasoGrade: Float32Array
  /** Índice da barra que cobre a tela. */
  torre: number
  cores: Cores
  ease: Eases
}
type Partes = ReturnType<typeof buscarPartes>
type Marcas = { numero: number; grade: number; dados: number; saida: number; cobrir: number }

export function cenaCondominios(ctx: ContextoCena): void {
  const { gsap, root, util, conteudo } = ctx
  const partes = buscarPartes(root)
  const { valor: total, prefixo } = conteudo.numeros.condominios
  const estado: Estado = { chegada: 0, numero: 0, grade: 0, cobrir: 0 }
  const eases = criarEases(gsap)
  const palco: { pintor: Pintura; cena: Cena | null } = {
    pintor: util.prepararCanvas2D(partes.canvas),
    cena: null,
  }
  root.classList.add('cond-com-campo')

  // A chegada acompanha a entrada da seção, antes do pin: as barras sobem para o lugar.
  gsap.to(estado, {
    chegada: 1,
    ease: 'none',
    scrollTrigger: { trigger: root, start: 'top bottom', end: 'top top', scrub: 0.7 },
  })
  // No celular as barras descem através da faixa dos números: eles esperam o voo passar.
  const espera = ctx.estreito() ? 0.15 : 0
  const { marcas, telas } = ritmo(ctx.estreito())
  const tl = util.pinScrub(root, {
    alvo: partes.palco,
    distancia: `+=${telas * 100}%`,
    patamares: 'pausas',
  })
  coreografar(tl, estado, { espera, marcas })
  ligarContadores(ctx, tl, (marcas.dados + espera) / telas)
  util.revelarTexto(partes.titulo, { gatilho: root, inicio: 'top 55%' })
  util.revelarTexto(partes.lead, { gatilho: root, inicio: 'top 55%', atraso: 0.15 })

  const familia = () => util.familiaDaFonte('--fonte-saira')
  const montar = () => {
    palco.pintor = util.prepararCanvas2D(partes.canvas)
    const fixos = { ease: eases, cores: lerCores(util) }
    const numeros = { total, glifo: `${prefixo}${total}`, familia: familia() }
    palco.cena = montarCena(partes, numeros, palco.pintor, fixos)
  }
  const montarComSeguranca = criarMontagemSegura(ctx, montar)
  ctx.ScrollTrigger.addEventListener('refresh', montarComSeguranca)
  util.registrarDesligamento(() => {
    ctx.ScrollTrigger.removeEventListener('refresh', montarComSeguranca)
  })
  ctx.pronto
    .then(() => document.fonts.load(`${PESO_GLIFO} 100px ${familia()}`))
    .then(montarComSeguranca)
    .catch((erro: unknown) => ctx.reportar(erro, 'fonte'))

  // O laço repõe o tema na volta para a tela; impresso, a seção é sempre clara.
  util.aoImprimir(() => {
    root.dataset.tema = 'claro'
  })
  // Se a montagem falhou (medida no meio de um recálculo, palco ainda sem tamanho), a cena não
  // fica vazia até o próximo refresh: com ela na tela, tenta de novo a cada meio segundo.
  let ultimaTentativa = -1
  util.lacoVisivel(root, (tempo) => {
    if (!palco.cena && tempo - ultimaTentativa > 0.5) {
      ultimaTentativa = tempo
      montarComSeguranca()
    }
    if (!palco.cena) return
    desenhar(palco.pintor, palco.cena, estado, tempo)
    trocarTema(root, palco.cena, estado, palco.pintor)
  })
}

const PESO_GLIFO = 500
/** Passo vertical da grade em relação ao horizontal (pattern: célula 8×16, folga 2×3). */
const PASSO_Y = 1.9
const LARGURA_BARRA = 0.8
const ALTURA_BARRA = 1.6

/** Eases do GSAP resolvidos uma vez, para o laço de desenho aplicar por barra. */
function criarEases(gsap: ContextoCena['gsap']) {
  return {
    numero: gsap.parseEase('power3.inOut'),
    grade: gsap.parseEase('expo.inOut'),
    chegada: gsap.parseEase('expo.out'),
    vertical: gsap.parseEase('power3.inOut'),
    // Lateral menos abrupta que expo: ela abre enquanto os pilares já sobem por baixo.
    lateral: gsap.parseEase('power2.inOut'),
  }
}

function buscarPartes(root: HTMLElement) {
  const achar = (seletor: string): HTMLElement => {
    const el = root.querySelector(seletor)
    if (!(el instanceof HTMLElement)) throw new Error(`[cena condominios] falta ${seletor}.`)
    return el
  }
  const canvas = root.querySelector('.cond-campo')
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error('[cena condominios] falta o canvas.')
  return {
    canvas,
    palco: achar('.cond-palco'),
    glifo: achar('.cond-alvo-glifo'),
    grade: achar('.cond-alvo-grade'),
    titulo: achar('#condominios-titulo'),
    lead: achar('.cond-texto .lead'),
    texto: achar('.cond-texto'),
  }
}

/* ---- Coreografia ---------------------------------------------------------------------
   A timeline do pin é medida em telas de rolagem: 1 unidade = 1 altura de tela. */

/** Onde cada passo começa, em telas. */
const MARCAS: Marcas = {
  numero: 0,
  grade: 1,
  dados: 1.3,
  // Patamar: grade montada (fecha em 1,8) e os três números parados até aqui.
  saida: 2.55,
  cobrir: 2.6,
}
const DURACAO_COBRIR = 0.55
/**
 * A última tela do pin são os pilares subindo por cima do palco (margem negativa de uma tela no
 * CSS). Eles entram logo que a torre começa a crescer: o título dos pilares leva ~0,36 tela
 * (respiro de topo + gatilho a 80% da tela) para aparecer, e a cobertura só parece completa
 * perto do fim. Assim o marinho fecha com o título dos pilares já na tela: nenhum quadro
 * só-marinho. Medido na página integrada de 390 a 2560px de largura.
 */
const CAUDA = 0.47
const TELAS = MARCAS.cobrir + DURACAO_COBRIR + CAUDA
/** No celular o número formado fica mais esta fração de tela: o patamar dele é curto. */
const FOLGA_NUMERO_ESTREITO = 0.3

/**
 * Marcas e extensão do pin para a largura da tela: no celular, tudo depois do número anda
 * FOLGA_NUMERO_ESTREITO; no desktop, as MARCAS como estão.
 */
function ritmo(estreito: boolean): { marcas: Marcas; telas: number } {
  const folga = estreito ? FOLGA_NUMERO_ESTREITO : 0
  const marcas: Marcas = {
    numero: MARCAS.numero,
    grade: MARCAS.grade + folga,
    dados: MARCAS.dados + folga,
    saida: MARCAS.saida + folga,
    cobrir: MARCAS.cobrir + folga,
  }
  return { marcas, telas: TELAS + folga }
}

function coreografar(
  tl: gsap.core.Timeline,
  estado: Estado,
  { espera, marcas }: { espera: number; marcas: Marcas },
): void {
  const entrar = { yPercent: 0, duration: 0.3, ease: 'power3.out' }
  const sair = { yPercent: -110, duration: 0.18, ease: 'power3.in' }
  // Rótulo e número de cada item entram juntos; os itens, em leve cascata.
  const porItem = (passo: number) => (i: number) => Math.floor(i / 2) * passo
  tl.to(estado, { numero: 1, duration: 0.85 }, marcas.numero)
    .fromTo('.cond-legenda .mascara-in', { yPercent: 110 }, entrar, 0.55)
    .to(estado, { grade: 1, duration: 0.8 }, marcas.grade)
    .fromTo(
      '.cond-texto',
      { clipPath: 'inset(-20% -6% -20% -6%)', y: 0 },
      { clipPath: 'inset(-20% -6% 100% -6%)', y: -34, duration: 0.3, ease: 'power3.in' },
      marcas.grade,
    )
    .to('.cond-legenda .mascara-in', sair, marcas.grade)
    .fromTo(
      '.cond-dados .mascara-in',
      { yPercent: 110 },
      { ...entrar, stagger: porItem(0.08) },
      marcas.dados + espera,
    )
    .to('.cond-dados .mascara-in', { ...sair, stagger: porItem(0.04) }, marcas.saida)
    .to(estado, { cobrir: 1, duration: DURACAO_COBRIR }, marcas.cobrir)
    .to({}, { duration: CAUDA })
}

/**
 * Os números contam quando a timeline passa pela entrada deles, indo para a frente; voltando bem
 * antes, ficam prontos para contar de novo. `limiar` é o progresso em que os números entram.
 */
function ligarContadores(ctx: ContextoCena, tl: gsap.core.Timeline, limiar: number): void {
  const { util, conteudo, root } = ctx
  const n = conteudo.numeros
  const itens = [
    { chave: 'anos', dado: { ...n.anos, prefixo: '', sufixo: '' } },
    { chave: 'clientes', dado: n.clientes },
    { chave: 'especialistas', dado: { ...n.especialistas, sufixo: '' } },
  ]
  const tweens = itens.flatMap(({ chave, dado }) => {
    const el = root.querySelector(`[data-conta="${chave}"]`)
    if (!(el instanceof HTMLElement)) return []
    const formatar = (v: number) => `${dado.prefixo}${util.formatarNumero(v)}${dado.sufixo}`
    const tween = util.contador(el, { para: dado.valor, formatar, gatilho: false, duracao: 1.6 })
    tween.pause(0)
    return [tween]
  })
  let contou = false
  tl.eventCallback('onUpdate', () => {
    const p = tl.progress()
    if (p >= limiar && !contou) {
      contou = true
      for (const tween of tweens) tween.restart()
    } else if (p < limiar - 0.03) contou = false
  })
}

/* ---- Montagem das poses ---------------------------------------------------------------- */

/**
 * A montagem que falha não derruba a cena: o laço tenta de novo. A falha vai ao Sentry uma vez
 * só (o laço repete a tentativa a cada meio segundo enquanto a cena está na tela).
 */
function criarMontagemSegura(ctx: ContextoCena, montar: () => void): () => void {
  let reportou = false
  return () => {
    try {
      montar()
    } catch (erro) {
      if (reportou) return
      reportou = true
      ctx.reportar(erro, 'barras')
    }
  }
}

function montarCena(
  partes: Partes,
  { total, glifo, familia }: { total: number; glifo: string; familia: string },
  pintor: Pintura,
  fixos: Pick<Cena, 'ease' | 'cores'>,
): Cena {
  const aleatorio = criarAleatorio(650)
  const base = partes.palco.getBoundingClientRect()
  const numero = poseNumero({ texto: glifo, familia }, relativa(partes.glifo, base), total)
  const { pose: grade, tom, torre } = poseGrade(relativa(partes.grade, base), total, aleatorio)
  const solta = poseSolta(total, campoSolto(partes, base, pintor), numero.w, aleatorio)
  const semente = Float32Array.from({ length: total }, () => aleatorio())
  return {
    solta,
    numero,
    grade,
    tom,
    semente,
    torre,
    atrasoNumero: atrasos(numero, centro(numero), semente),
    atrasoGrade: atrasos(grade, { x: grade.x[torre], y: grade.y[torre] }, semente),
    ...fixos,
  }
}

function relativa(el: HTMLElement, base: DOMRect): Caixa {
  const r = el.getBoundingClientRect()
  return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height }
}

/** Gerador determinístico (mulberry32): o mesmo desenho a cada recálculo. */
function criarAleatorio(semente: number): () => number {
  let a = semente >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Ordena pontos por x (e y no empate) e devolve a pose. Número e grade são ordenados do mesmo
 * jeito, então cada barra viaja para a mesma faixa horizontal: menos cruzamento.
 */
function poseOrdenada(pontos: Ponto[], w: number, h: number): Pose {
  pontos.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  return {
    x: Float32Array.from(pontos, (p) => p[0]),
    y: Float32Array.from(pontos, (p) => p[1]),
    w,
    h,
  }
}

function centro(pose: Pose): { x: number; y: number } {
  let x = 0
  let y = 0
  for (let i = 0; i < pose.x.length; i++) {
    x += pose.x[i]
    y += pose.y[i]
  }
  return { x: x / pose.x.length, y: y / pose.y.length }
}

/**
 * Atraso de cada barra pela distância ao ponto de origem, com um pouco de semente para não formar
 * anéis perfeitos.
 */
function atrasos(pose: Pose, origem: { x: number; y: number }, semente: Float32Array) {
  const d = Float32Array.from(pose.x, (x, i) => Math.hypot(x - origem.x, pose.y[i] - origem.y))
  const maximo = Math.max(...d) || 1
  return d.map((v, i) => Math.min(1, (v / maximo) * 0.85 + semente[i] * 0.15))
}

/**
 * Onde as barras soltas flutuam: a faixa do número (lado esquerdo no desktop, topo no celular),
 * com sobra, para não cruzarem o texto que já está na tela.
 */
function campoSolto(partes: Partes, base: DOMRect, pintor: Pintura): Caixa {
  const numero = relativa(partes.glifo, base)
  const texto = relativa(partes.texto, base)
  if (texto.x > numero.x + numero.w * 0.5) {
    return { x: 0, y: pintor.h * 0.08, w: texto.x - numero.w * 0.06, h: pintor.h * 0.88 }
  }
  return { x: 0, y: pintor.h * 0.06, w: pintor.w, h: numero.y + numero.h * 1.5 - pintor.h * 0.06 }
}

/** Barras espalhadas e pequenas (o mesmo módulo 1:2, menor), soltas no campo. */
function poseSolta(n: number, campo: Caixa, larguraNumero: number, aleatorio: () => number): Pose {
  const pontos = Array.from(
    { length: n },
    (): Ponto => [campo.x + campo.w * (0.03 + aleatorio() * 0.94), campo.y + campo.h * aleatorio()],
  )
  const w = Math.max(1.5, larguraNumero * 0.5)
  return poseOrdenada(pontos, w, w * 2)
}

/**
 * O número desenhado em Saira num canvas fora da tela; as barras ocupam um reticulado 1:1,9
 * dentro da tinta, com o passo ajustado para caber exatamente `n` barras. O desenho é feito numa
 * resolução fixa e só depois levado à caixa: o resultado não depende do tamanho da tela, do zoom
 * nem do DPR.
 */
function poseNumero(glifo: { texto: string; familia: string }, caixa: Caixa, n: number): Pose {
  if (caixa.w < 8 || caixa.h < 4) throw new Error('A caixa do número ainda não tem tamanho.')
  const tinta = rasterizarTexto(glifo, caixa.h / caixa.w)
  const escala = caixa.w / tinta.w
  const passo = acharPasso(tinta, n)
  const todos = reticulado(tinta, passo)
  const pontos = Array.from({ length: n }, (_, k): Ponto => {
    // Com tinta de sobra, os pontos que sobram saem de forma uniforme. Se faltar (tinta mínima,
    // ver acharPasso), o módulo repete pontos em vez de falhar.
    const p = todos[Math.floor((k * todos.length) / n) % todos.length]
    return [caixa.x + p[0] * escala, caixa.y + p[1] * escala]
  })
  return poseOrdenada(pontos, passo * escala * LARGURA_BARRA, passo * escala * ALTURA_BARRA)
}

const RESOLUCAO_GLIFO = 1600

/** `proporcao` é altura / largura da caixa. */
function rasterizarTexto(
  { texto, familia }: { texto: string; familia: string },
  proporcao: number,
): Tinta {
  const tela = document.createElement('canvas')
  tela.width = RESOLUCAO_GLIFO
  tela.height = Math.max(64, Math.round(RESOLUCAO_GLIFO * proporcao))
  const c = tela.getContext('2d', { willReadFrequently: true })
  if (!c) throw new Error('Canvas 2D indisponível para desenhar o número.')
  c.font = `${PESO_GLIFO} 100px ${familia}, sans-serif`
  const m = c.measureText(texto)
  const larg = m.actualBoundingBoxLeft + m.actualBoundingBoxRight
  const alt = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
  if (!(larg > 0 && alt > 0)) throw new Error('A fonte não desenhou o número.')
  const escala = Math.min((tela.width * 0.98) / larg, (tela.height * 0.96) / alt)
  c.font = `${PESO_GLIFO} ${100 * escala}px ${familia}, sans-serif`
  c.textAlign = 'left'
  c.textBaseline = 'alphabetic'
  const x = m.actualBoundingBoxLeft * escala
  const y = (tela.height - alt * escala) / 2 + m.actualBoundingBoxAscent * escala
  c.fillText(texto, x, y)
  return {
    dados: c.getImageData(0, 0, tela.width, tela.height).data,
    w: tela.width,
    h: tela.height,
  }
}

function reticulado(tinta: Tinta, passo: number): Ponto[] {
  const passoY = passo * PASSO_Y
  const pontos: Ponto[] = []
  for (let y = passoY / 2; y < tinta.h; y += passoY) {
    for (let x = passo / 2; x < tinta.w; x += passo) {
      if (tinta.dados[(Math.floor(y) * tinta.w + Math.floor(x)) * 4 + 3] > 127) pontos.push([x, y])
    }
  }
  return pontos
}

/**
 * Maior passo que ainda põe pelo menos `n` pontos dentro da tinta. A contagem não é estritamente
 * monótona no passo (o reticulado escorrega sobre a tinta), então a busca guarda o último passo
 * que COMPROVADAMENTE coube. Se nem o passo mínimo couber, devolve o mínimo e poseNumero repete
 * pontos: nunca lança por falta de espaço.
 */
function acharPasso(tinta: Tinta, n: number): number {
  const minimo = 1
  let coube = minimo
  let baixo = minimo
  let alto = tinta.w / 4
  for (let i = 0; i < 24; i++) {
    const meio = (baixo + alto) / 2
    if (reticulado(tinta, meio).length >= n) {
      coube = meio
      baixo = meio
    } else alto = meio
  }
  if (reticulado(tinta, coube).length === 0) throw new Error('O número saiu sem tinta.')
  return coube
}

/**
 * A grade do pattern: colunas regulares ancoradas embaixo, com o perfil de prédios em marinho,
 * janelas e telhados em tom médio e o céu em lavanda.
 */
function poseGrade(caixa: Caixa, n: number, aleatorio: () => number) {
  const { cols, linhas, passo } = dimensoesGrade(caixa, n)
  const perfil = perfilHorizonte(cols, linhas, aleatorio)
  const x0 = caixa.x + (caixa.w - cols * passo) / 2
  const base = caixa.y + caixa.h
  const celulas: Array<[number, number, number]> = []
  for (let i = 0; i < n; i++) {
    const c = Math.floor(i / linhas)
    const linha = i % linhas
    const tom = tomDaCelula({ c, linha, altura: perfil[c] }, aleatorio)
    celulas.push([x0 + (c + 0.5) * passo, base - (linha + 0.5) * passo * PASSO_Y, tom])
  }
  const colTorre = perfil.indexOf(linhas)
  const yTorre = base - (linhas - 0.5) * passo * PASSO_Y
  const pose = poseOrdenada(
    celulas.map((c): Ponto => [c[0], c[1]]),
    passo * LARGURA_BARRA,
    passo * ALTURA_BARRA,
  )
  // A ordenação mantém as células em ordem de coluna e, dentro dela, de cima para baixo.
  celulas.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const xTorre = x0 + (colTorre + 0.5) * passo
  const torre = celulas.findIndex(
    (c) => Math.abs(c[0] - xTorre) < 0.5 && Math.abs(c[1] - yTorre) < 0.5,
  )
  if (torre < 0) throw new Error('A torre não entrou na grade.')
  return { pose, tom: Uint8Array.from(celulas, (c) => c[2]), torre }
}

/** Colunas × linhas que dão a maior barra dentro da caixa. */
function dimensoesGrade(caixa: Caixa, n: number): { cols: number; linhas: number; passo: number } {
  let melhor = { cols: n, linhas: 1, passo: 0 }
  for (let linhas = 1; linhas <= n; linhas++) {
    if (n % linhas !== 0) continue
    const cols = n / linhas
    const passo = Math.min(caixa.w / cols, caixa.h / (linhas * PASSO_Y))
    if (passo > melhor.passo) melhor = { cols, linhas, passo }
  }
  return melhor
}

/**
 * Altura de cada coluna, em linhas: prédios de 2 a 5 colunas com vãos, e uma torre de 3 colunas
 * na divisão áurea cuja barra central é a única que toca a linha de cima.
 */
function perfilHorizonte(cols: number, linhas: number, aleatorio: () => number): number[] {
  const perfil: number[] = new Array(cols).fill(0)
  const teto = Math.max(2, linhas - 2)
  for (let c = 1; c < cols - 1; ) {
    const largura = 2 + Math.floor(aleatorio() * 4)
    const altura = Math.max(2, Math.round(teto * (0.35 + aleatorio() * 0.65)))
    for (let j = 0; j < largura && c + j < cols - 1; j++) perfil[c + j] = altura
    c += largura + (aleatorio() < 0.55 ? 1 : 0)
  }
  const t = Math.min(cols - 2, Math.max(1, Math.round(cols * 0.618)))
  perfil[t - 1] = linhas - 1
  perfil[t] = linhas
  perfil[t + 1] = linhas - 1
  return perfil
}

/** 0 lavanda, 1 tom médio, 2 marinho. Mesma regra do pattern dos fundamentos. */
function tomDaCelula(
  { c, linha, altura }: { c: number; linha: number; altura: number },
  aleatorio: () => number,
): number {
  if (linha < altura) return linha % 3 === 2 && c % 2 === 0 && linha < altura - 1 ? 1 : 2
  if (linha === altura && altura > 0 && aleatorio() > 0.45) return 1
  return aleatorio() > 0.9 ? 1 : 0
}

function lerCores(util: ContextoCena['util']): Cores {
  const lavanda = util.corDoToken('--lavanda')
  const marinho = util.corDoToken('--marinho')
  const azul = util.corDoToken('--azul-medio')
  const medio = misturar(lavanda, azul, 0.2)
  return { solta: misturar(lavanda, azul, 0.16), numero: marinho, tons: [lavanda, medio, marinho] }
}

function misturar(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

/* ---- Desenho --------------------------------------------------------------------------- */

/** Progresso local de uma barra: começa após o seu atraso. */
function local(t: number, atraso: number, folga = 0.45): number {
  return Math.min(1, Math.max(0, (t - atraso * folga) / (1 - folga)))
}

function desenhar(pintor: Pintura, cena: Cena, estado: Estado, tempo: number): void {
  const { ctx, w, h } = pintor
  ctx.clearRect(0, 0, w, h)
  const n = cena.semente.length
  for (let i = 0; i < n; i++) {
    if (estado.cobrir > 0 && i === cena.torre) continue
    desenharBarra(ctx, { cena, estado, altura: h }, i, tempo)
  }
  ctx.globalAlpha = 1
  if (estado.cobrir > 0) {
    const r = retanguloCobertura(cena, estado.cobrir, pintor)
    ctx.fillStyle = rgb(cena.cores.numero)
    ctx.fillRect(r.x, r.y, r.w, r.h)
  }
}

function desenharBarra(
  ctx: CanvasRenderingContext2D,
  { cena, estado, altura }: { cena: Cena; estado: Estado; altura: number },
  i: number,
  tempo: number,
): void {
  const s = cena.semente[i]
  const { ease } = cena
  const chegou = ease.chegada(local(estado.chegada, s, 0.5))
  const eN = ease.numero(local(estado.numero, cena.atrasoNumero[i]))
  const eG = ease.grade(local(estado.grade, cena.atrasoGrade[i]))
  const livre = 1 - eN
  const deriva = 7 * livre
  const lado = s < 0.5 ? -1 : 1
  let x = lerp(cena.solta.x[i] + Math.sin(tempo * 0.5 + s * 6.283) * deriva, cena.numero.x[i], eN)
  let y = lerp(cena.solta.y[i] + Math.cos(tempo * 0.4 + s * 12.57) * deriva, cena.numero.y[i], eN)
  x += Math.sin(eN * Math.PI) * altura * 0.035 * lado
  y += (1 - chegou) * altura * 0.4
  x = lerp(x, cena.grade.x[i], eG) + Math.sin(eG * Math.PI) * cena.grade.w * 1.2 * lado
  y = lerp(y, cena.grade.y[i], eG)
  const bw = lerp(lerp(cena.solta.w, cena.numero.w, eN), cena.grade.w, eG)
  const bh = lerp(lerp(cena.solta.h, cena.numero.h, eN), cena.grade.h, eG)
  const cor = misturar(
    misturar(cena.cores.solta, cena.cores.numero, eN),
    cena.cores.tons[cena.tom[i]],
    eG,
  )
  ctx.globalAlpha = chegou
  ctx.fillStyle = rgb(cor)
  ctx.fillRect(x - bw / 2, y - bh / 2, bw, bh)
}

/**
 * A torre cresce primeiro na vertical (até a altura do palco) e, sobrepondo, na horizontal até
 * cobrir tudo. Folga de 2px nas bordas para não sobrar fio.
 */
function retanguloCobertura(cena: Cena, cobrir: number, pintor: Pintura): Caixa {
  const { grade, torre, ease } = cena
  const v = ease.vertical(Math.min(1, cobrir / 0.55))
  // A lateral fecha em 90% do passo: o último trecho é marinho inteiro, sem fio de borda.
  const hz = ease.lateral(Math.min(1, Math.max(0, (cobrir - 0.15) / 0.75)))
  const topo = lerp(grade.y[torre] - grade.h / 2, -2, v)
  const fundo = lerp(grade.y[torre] + grade.h / 2, pintor.h + 2, v)
  const esq = lerp(grade.x[torre] - grade.w / 2, -2, hz)
  const dir = lerp(grade.x[torre] + grade.w / 2, pintor.w + 2, hz)
  return { x: esq, y: topo, w: dir - esq, h: fundo - topo }
}

/**
 * O cabeçalho copia o tema da seção: vira marinho quando a cobertura já passa por baixo dele. O
 * core relê o tema só quando há evento de rolagem, mas o scrub ainda anda depois que a rolagem
 * para (nos dois sentidos): com a seção sob o cabeçalho, ela mesma acerta o cabeçalho.
 */
function trocarTema(root: HTMLElement, cena: Cena, estado: Estado, pintor: Pintura): void {
  let tema = 'claro'
  if (estado.cobrir > 0) {
    const r = retanguloCobertura(cena, estado.cobrir, pintor)
    // Marinho quando a cobertura já passa por baixo do cabeçalho e ocupa quase toda a largura:
    // cabeçalho claro sobre uma tela quase toda marinho destoa mais que o contrário.
    const largura = Math.min(r.x + r.w, pintor.w) - Math.max(r.x, 0)
    if (r.y <= 0 && largura >= pintor.w * 0.8) tema = 'marinho'
  }
  if (root.dataset.tema !== tema) root.dataset.tema = tema
  const cabecalho = document.querySelector('[data-cabecalho]')
  if (!(cabecalho instanceof HTMLElement) || cabecalho.dataset.tema === tema) return
  const linha = cabecalho.getBoundingClientRect().bottom + 1
  const caixa = root.getBoundingClientRect()
  if (caixa.top <= linha && caixa.bottom > linha) cabecalho.dataset.tema = tema
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function rgb(c: Rgb): string {
  return `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`
}
