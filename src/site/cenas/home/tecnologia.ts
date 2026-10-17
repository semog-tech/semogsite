import type { NumerosDaPrestacao } from '@/site/conteudo/conteudo'
import { estaPendente, type OuPendente } from '@/site/conteudo/pendencias'
import type { ContextoCena } from '@/site/core/tipos'
import { type BaseTecnologia, criarBase, sorteador } from './tecnologia-base'
import {
  type Atlas,
  type Cores,
  criarAtlas,
  criarCores,
  frenteDaOnda,
  pintarQuadro,
  type Quadro,
  type RotulosPalco,
} from './tecnologia-desenho'
import { type Fontes, type Geometria, medirGeometria, type Retangulo } from './tecnologia-layout'
import { montarPercurso, type Percurso, trechoVisivel } from './tecnologia-percurso'
import {
  ADENDO,
  atrasoDoCentro,
  CAMPOS,
  CAMPOS_FOLHA,
  calcularFolhas,
  calcularPoses,
  conteudoFolhas,
  criarMapa,
  erpEmQueda,
  FOLHAS,
  faixa,
  ITENS_ONE,
  type Mapa,
  misturarFolhas,
  misturarItens,
  novaPose,
  PASSOS,
  type Poses,
  suave,
  trechoAtual,
} from './tecnologia-poses'

/**
 * Cena da tecnologia, a cena-assinatura. Num palco fixado, os mesmos itens (um por condomínio)
 * contam a prestação de contas inteira: números do ERP descem e são conferidos, viram folhas, as
 * folhas viram um PDF com sumário e abas, o PDF é assinado, condensa num QR de barras, e o QR se
 * abre no campo de condomínios do Semog One. Um único traço marinho costura tudo. À esquerda, a
 * legenda do passo ativo entra por máscara; a trilha leva a cada passo. Sem JS, a seção é um
 * documento com os cinco passos em lista.
 *
 * Módulos: tecnologia-base (dados fixos), -layout (medidas), -poses (roteiro), -percurso (o
 * traço) e -desenho (canvas).
 */

/**
 * Itens do palco enquanto os números da nova prestação estão pendentes: a grade do protótipo
 * (22 colunas × 10 linhas). Não é dado: o rótulo do campo mostra "A CONFIRMAR" no lugar do número.
 */
const ITENS_SEM_O_NUMERO = 220

type Estado = { p: number; formar: number }
type Fixos = {
  canvas: HTMLCanvasElement
  legendas: HTMLElement
  fundo: HTMLElement
  rotulos: RotulosPalco
  cores: Cores
  conteudo: Retangulo[][]
  fontes: Fontes
}
type Medida = {
  c2d: CanvasRenderingContext2D
  geo: Geometria
  atlas: Atlas
  base: BaseTecnologia
  cores: Cores
  rotulos: RotulosPalco
  fontes: Fontes
  poses: Poses
  folhas: Poses
  perc: Percurso
  centro: Float32Array
}
type QuadroVivo = { pose: Float32Array; folhas: Float32Array; fundo: number }

export function cenaTecnologia(ctx: ContextoCena): void {
  const { root, util, gsap } = ctx
  const palco = exigir(root, '.tec-palco')
  const numeros = numerosConhecidos(ctx.conteudo.tecnologia.numerosDaPrestacao)
  const n = numeros ? numeros.condominios : ITENS_SEM_O_NUMERO
  prepararTextos(ctx)
  root.classList.add('tec-com-palco')
  // Se a cena quebrar depois daqui, a seção volta a ser o documento em lista.
  util.registrarDesligamento(() => root.classList.remove('tec-com-palco'))
  /** p é o tempo da história (0 a 1), já com os patamares descontados da rolagem. */
  const estado: Estado = { p: 0, formar: 0 }
  const legenda = criarLegenda(ctx)
  const mapa = criarMapa(ctx.estreito())
  // O pin nasce já, na ordem da página; o palco só desenha depois de medido.
  const tl = util.pinScrub(root, {
    alvo: palco,
    distancia: `+=${Math.round(mapa.total * 100)}%`,
    scrub: 0.7,
    // A timeline é um tween só (a rolagem inteira): os patamares vêm do mapa, não de pausas.
    patamares: () => mapa.patamares(),
  })
  // O pin termina com o último patamar formado (custos por categoria) sobre fundo já branco; o
  // palco sai da tela pela própria rolagem e a cena seguinte entra sem tela vazia.
  const rolagem = { r: 0 }
  tl.to(rolagem, {
    r: 1,
    duration: 1,
    onUpdate: () => {
      estado.p = mapa.historia(rolagem.r)
      legenda.aplicar(estado.p)
    },
  })
  legenda.aplicar(0)
  gsap.to(estado, {
    formar: 1,
    ease: 'none',
    scrollTrigger: { trigger: root, start: 'top 85%', end: 'top top', scrub: 0.6 },
  })
  ligarTrilha(ctx, tl, mapa)
  montarPalco(ctx, { palco, estado, base: criarBase(n), pendente: !numeros })
}

/**
 * Os números da nova prestação, ou nulo enquanto pendentes. Recebe o tipo declarado: o do
 * conteúdo, estreitado pela pendência de hoje, esconderia o caso com dado.
 */
function numerosConhecidos(numeros: OuPendente<NumerosDaPrestacao>): NumerosDaPrestacao | null {
  return estaPendente(numeros) ? null : numeros
}

function exigir(raiz: ParentNode, seletor: string): HTMLElement {
  const el = raiz.querySelector(seletor)
  if (!(el instanceof HTMLElement)) throw new Error(`[cena tecnologia] falta ${seletor}.`)
  return el
}

/* ---- Textos ------------------------------------------------------------------- */

/** Número inteiro, com ou sem milhar; fora de data ("30/09"), que não conta. */
const NUMERO = /(?<![\d/])\d{1,3}(?:\.\d{3})*(?![\d/])/g

/**
 * Números do contexto contam ao entrar; a frase depois dos dois-pontos do primeiro passo ganha
 * peso. Só os nós de texto mudam (o selo A CONFIRMAR do contexto fica como está), e o que o React
 * renderizou volta no desmonte.
 */
function prepararTextos({ root, util }: ContextoCena): void {
  const contexto = exigir(root, '.tec-contexto')
  util.registrarDesligamento(guardarFilhos(contexto))
  const textos = Array.from(contexto.childNodes).filter((no) => no instanceof Text)
  for (const no of textos) contarNumeros(no)
  for (const span of Array.from(contexto.querySelectorAll<HTMLElement>('.tec-num'))) {
    const para = Number((span.textContent ?? '0').replace(/\./g, ''))
    util.contador(span, { para, gatilho: root, inicio: 'top 60%' })
  }
  const primeiro = exigir(root, '[data-passo="0"] p')
  util.registrarDesligamento(guardarFilhos(primeiro))
  enfatizarConferencia(primeiro)
}

/** Guarda os filhos que o React pôs no elemento; devolve o que os repõe. */
function guardarFilhos(el: HTMLElement): () => void {
  const originais = Array.from(el.childNodes)
  return () => el.replaceChildren(...originais)
}

/** Troca, num nó de texto, cada número por um `.num.tec-num` com o mesmo texto. */
function contarNumeros(no: Text): void {
  const texto = no.data
  const partes: (string | HTMLElement)[] = []
  let ultimo = 0
  for (const m of texto.matchAll(NUMERO)) {
    partes.push(texto.slice(ultimo, m.index))
    const span = document.createElement('span')
    span.className = 'num tec-num'
    span.textContent = m[0]
    partes.push(span)
    ultimo = (m.index ?? 0) + m[0].length
  }
  if (!partes.length) return
  partes.push(texto.slice(ultimo))
  no.replaceWith(...partes)
}

/** "...: se um total não bate, o documento não sai." → o trecho final em peso. */
function enfatizarConferencia(p: HTMLElement): void {
  const texto = p.textContent ?? ''
  const corte = texto.indexOf(': ')
  if (corte < 0) return
  const enfase = document.createElement('em')
  enfase.className = 'peso'
  enfase.textContent = texto.slice(corte + 2)
  p.replaceChildren(texto.slice(0, corte + 2), enfase)
}

/** Textos do palco, da parcial (marcados como TEXTO-NOVO lá). */
function lerRotulos(root: HTMLElement, n: number, pendente: boolean, ctx: ContextoCena) {
  const todos = (nome: string) =>
    Array.from(
      root.querySelectorAll(`[data-rotulo="${nome}"]`),
      (el) => el.textContent?.trim() ?? '',
    )
  const um = (nome: string) => {
    const [texto] = todos(nome)
    if (!texto) throw new Error(`[cena tecnologia] falta o rótulo "${nome}" na seção.`)
    return texto
  }
  // Sem o número da nova prestação, o campo diz que ele falta (DP5), em vez de um número.
  const condominios = pendente
    ? `${um('condominios')} · A CONFIRMAR`
    : `${ctx.util.formatarNumero(n)} ${um('condominios')}`
  const rotulos: RotulosPalco = {
    folhas: todos('folha'),
    assinaturas: todos('assinatura'),
    parecer: um('parecer'),
    url: um('url'),
    confere: um('confere'),
    adendo: um('adendo'),
    original: um('original'),
    historico: um('historico'),
    convencao: um('convencao'),
    condominios,
  }
  return rotulos
}

/* ---- Legenda ------------------------------------------------------------------ */

type Troca = (k: number, animar: boolean) => void
type EstadoLegenda = { ativo: number; entrou: boolean }

/**
 * Passo ativo entra por máscara (linhas sobem de baixo), o anterior sai por cima, com
 * sobreposição. O título do passo ganha peso. A trilha mostra o progresso dentro do passo.
 */
function criarLegenda(ctx: ContextoCena) {
  const { gsap, SplitText, ScrollTrigger, root, util, pronto } = ctx
  const passos = Array.from(root.querySelectorAll<HTMLElement>('.tec-passo'))
  const divisao = {
    type: 'lines',
    mask: 'lines',
    linesClass: 'revela-linha',
    autoSplit: true,
  } as const
  const splits = passos.map((li) => SplitText.create(li.querySelectorAll('.tec-revela'), divisao))
  const linhas = (k: number) => splits[k].lines
  const botoes = Array.from(root.querySelectorAll<HTMLElement>('[data-ir]'))
  // O progresso e o passo atual da trilha são estilo e atributo postos fora do GSAP: saem no desmonte.
  util.registrarDesligamento(() => {
    for (const botao of botoes) {
      botao.style.removeProperty('--prog')
      botao.removeAttribute('aria-current')
    }
  })
  const estado: EstadoLegenda = { ativo: -1, entrou: false }
  const trocar = criarTroca(gsap, passos, linhas, estado)
  const marcarSub = criarSub(gsap, passos)
  gsap.set(linhas(0), { yPercent: 110 })
  ScrollTrigger.create({
    trigger: root,
    start: 'top 65%',
    once: true,
    onEnter: () => {
      estado.entrou = true
      if (estado.ativo >= 0) trocar(estado.ativo, true)
    },
  })
  entradaDoTitulo(ctx)
  // Com html.motion a legenda muda de corpo e de largura: as linhas são refeitas na medida nova
  // (o autoSplit só vigia a largura do elemento, não o corpo do texto).
  pronto
    .then(() => {
      for (const split of splits) split.split(divisao)
      if (!estado.entrou && estado.ativo >= 0) gsap.set(linhas(estado.ativo), { yPercent: 110 })
    })
    .catch((erro: unknown) => ctx.reportar(erro, 'pronto'))
  util.aoImprimir(() => {
    gsap.set(
      splits.flatMap((s) => s.lines),
      { yPercent: 0 },
    )
  })
  return {
    aplicar(p: number) {
      const k = indiceEm(PASSOS, p)
      if (k !== estado.ativo) trocar(k, estado.entrou)
      marcarTrilha(botoes, k, p)
      marcarSub(p)
    },
  }
}

/** Título por linhas; subtítulo e contexto (que tem números que contam) por máscara em bloco. */
function entradaDoTitulo({ gsap, util, root }: ContextoCena): void {
  util.revelarTexto(exigir(root, '.tec-titulo'), { gatilho: root, inicio: 'top 70%' })
  gsap.fromTo(
    [exigir(root, '.tec-sub'), exigir(root, '.tec-contexto')],
    { clipPath: 'inset(0% 0% 100% 0%)', y: 21 },
    {
      clipPath: 'inset(0% 0% -20% 0%)',
      y: 0,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.12,
      delay: 0.25,
      scrollTrigger: { trigger: root, start: 'top 70%', once: true },
    },
  )
}

/** Índice do último início ≤ p. */
function indiceEm(inicios: readonly number[], p: number): number {
  let k = -1
  inicios.forEach((ini, j) => {
    if (p >= ini) k = j
  })
  return k
}

/** Monta a troca de passo (saída por cima, entrada por baixo, peso no título). */
function criarTroca(
  gsap: ContextoCena['gsap'],
  passos: HTMLElement[],
  linhas: (k: number) => Element[],
  estado: EstadoLegenda,
): Troca {
  return (k, animar) => {
    const anterior = estado.ativo
    estado.ativo = k
    passos.forEach((li, j) => {
      if (j !== k && j !== anterior) li.classList.remove('ativo', 'saindo')
    })
    const entra = passos[k]
    if (anterior >= 0 && anterior !== k) {
      sairPasso(gsap, passos[anterior], linhas(anterior), estado, anterior)
    }
    if (!entra) return
    entra.classList.remove('saindo')
    entra.classList.add('ativo')
    if (!animar) return
    const atraso = anterior >= 0 && anterior !== k ? 0.3 : 0
    gsap.fromTo(
      linhas(k),
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.05,
        delay: atraso,
        overwrite: true,
      },
    )
    gsap.fromTo(
      entra.querySelector('h3'),
      { fontVariationSettings: '"wght" 250' },
      {
        fontVariationSettings: '"wght" 520',
        duration: 1.3,
        ease: 'power2.inOut',
        delay: atraso + 0.15,
        overwrite: true,
      },
    )
  }
}

function sairPasso(
  gsap: ContextoCena['gsap'],
  li: HTMLElement,
  linhas: Element[],
  estado: EstadoLegenda,
  indice: number,
): void {
  li.classList.remove('ativo')
  li.classList.add('saindo')
  gsap.to(linhas, {
    yPercent: -110,
    duration: 0.45,
    ease: 'expo.in',
    stagger: 0.02,
    overwrite: true,
    onComplete: () => {
      if (estado.ativo !== indice) li.classList.remove('saindo')
    },
  })
}

/** Botão atual e progresso dentro de cada passo (--prog de 0 a 1). */
function marcarTrilha(botoes: HTMLElement[], k: number, p: number): void {
  botoes.forEach((botao, j) => {
    const fim = PASSOS[j + 1] ?? 1
    const prog = j < k ? 1 : j === k ? faixa(p, PASSOS[j], fim) : 0
    botao.style.setProperty('--prog', prog.toFixed(3))
    if (j === k) botao.setAttribute('aria-current', 'step')
    else botao.removeAttribute('aria-current')
  })
}

/**
 * Itens do Semog One: cada diferencial tem o seu patamar no palco e entra sozinho na legenda, por
 * máscara, quando o palco chega nele. O adendo ganha tom cheio na hora dele.
 */
function criarSub(gsap: ContextoCena['gsap'], passos: HTMLElement[]): (p: number) => void {
  const itens = Array.from(passos[4]?.querySelectorAll('.tec-itens li') ?? [])
  const linhasDe = (li: Element) => li.querySelectorAll('.revela-linha')
  let atual = -1
  return (p) => {
    passos[3]?.querySelector('.tec-adendo')?.classList.toggle('ativo', p >= ADENDO)
    const sub = indiceEm(ITENS_ONE, p)
    if (sub === atual) return
    const anterior = itens[atual]
    atual = sub
    itens.forEach((li, j) => {
      li.classList.toggle('ativo', j === sub)
    })
    if (anterior) {
      anterior.classList.add('saindo')
      gsap.to(linhasDe(anterior), {
        yPercent: -110,
        duration: 0.45,
        ease: 'expo.in',
        overwrite: true,
        onComplete: () => {
          if (!anterior.classList.contains('ativo')) anterior.classList.remove('saindo')
        },
      })
    }
    const novo = itens[sub]
    if (!novo) return
    novo.classList.remove('saindo')
    gsap.fromTo(
      linhasDe(novo),
      { yPercent: 110 },
      { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.05, delay: 0.3, overwrite: true },
    )
  }
}

/** Botões da trilha: rolam até o quadro em que o passo já está formado. */
function ligarTrilha(
  { root, lenis, util }: ContextoCena,
  tl: ReturnType<ContextoCena['util']['pinScrub']>,
  mapa: Mapa,
): void {
  const ouvintes = new AbortController()
  for (const botao of Array.from(root.querySelectorAll('[data-ir]'))) {
    botao.addEventListener(
      'click',
      () => {
        const st = tl.scrollTrigger
        if (!st) return
        const alvo = mapa.alvoDaTrilha(Number(botao.getAttribute('data-ir')))
        const y = st.start + (st.end - st.start) * alvo
        if (lenis) lenis.scrollTo(y, { duration: 1.4 })
        else window.scrollTo({ top: y, behavior: 'smooth' })
      },
      { signal: ouvintes.signal },
    )
  }
  util.registrarDesligamento(() => ouvintes.abort())
}

/* ---- Palco -------------------------------------------------------------------- */

type OpcoesPalco = { palco: HTMLElement; estado: Estado; base: BaseTecnologia; pendente: boolean }

/** Liga o canvas: mede no refresh (e quando as fontes chegam), pinta no laço visível. */
function montarPalco(ctx: ContextoCena, { palco, estado, base, pendente }: OpcoesPalco): void {
  const { root, util, ScrollTrigger } = ctx
  const canvas = root.querySelector('.tec-campo')
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error('[cena tecnologia] falta .tec-campo.')
  const fontes: Fontes = {
    saira: util.familiaDaFonte('--fonte-saira'),
    barlow: util.familiaDaFonte('--fonte-barlow'),
  }
  const fixos: Fixos = {
    canvas,
    legendas: exigir(root, '.tec-legendas'),
    fundo: exigir(root, '.tec-fundo'),
    rotulos: lerRotulos(root, base.n, pendente, ctx),
    cores: criarCores(util.corDoToken),
    conteudo: conteudoFolhas(base, sorteador),
    fontes,
  }
  let atual: Medida | null = null
  let vivo = true
  const montar = () => {
    // Antes de html.motion o palco ainda não tem a altura de uma tela: nada a medir.
    if (!vivo || !document.documentElement.classList.contains('motion')) return
    try {
      atual = medirPalco(ctx, palco, base, fixos)
    } catch (erro) {
      atual = null
      // O palco fica sem desenho e a legenda segue; a falha vai ao Sentry (`cena:tecnologia:palco`).
      ctx.reportar(erro, 'palco')
    }
  }
  ScrollTrigger.addEventListener('refresh', montar)
  util.registrarDesligamento(() => {
    vivo = false
    ScrollTrigger.removeEventListener('refresh', montar)
  })
  const carregar = [
    `400 12px ${fontes.saira}`,
    `500 12px ${fontes.saira}`,
    `400 12px ${fontes.barlow}`,
  ].map((fonte) => document.fonts.load(fonte))
  Promise.all(carregar)
    .catch((erro: unknown) => ctx.reportar(erro, 'fontes'))
    .finally(montar)
  const quadro: QuadroVivo = {
    pose: novaPose(base.n),
    folhas: new Float32Array(FOLHAS * CAMPOS_FOLHA),
    fundo: -1,
  }
  util.lacoVisivel(root, (tempo) => {
    if (atual) pintar(atual, quadro, estado, tempo, fixos.fundo)
  })
  util.registrarDesligamento(() => fixos.fundo.style.removeProperty('opacity'))
}

/** Mede, monta poses, atlas e percurso para o tamanho atual do palco. */
function medirPalco(
  ctx: ContextoCena,
  palco: HTMLElement,
  base: BaseTecnologia,
  fixos: Fixos,
): Medida {
  const { util } = ctx
  const { ctx: c2d } = util.prepararCanvas2D(fixos.canvas)
  const medirTexto = (fonte: string, texto: string) => {
    c2d.font = `${fonte}, system-ui, sans-serif`
    return c2d.measureText(texto).width
  }
  const geo = medirGeometria({
    legendas: fixos.legendas,
    palco,
    compacta: ctx.estreito(),
    base,
    conteudo: fixos.conteudo,
    medirTexto,
    rotulos: fixos.rotulos,
    fontes: fixos.fontes,
  })
  const marinho = fixos.cores.marinho
  const atlas = criarAtlas(base, geo.erp.fonte, util.dprMaximo(), marinho, fixos.fontes.saira)
  geo.larguraNumero.set(atlas.largura)
  return {
    c2d,
    geo,
    atlas,
    base,
    cores: fixos.cores,
    rotulos: fixos.rotulos,
    fontes: fixos.fontes,
    poses: calcularPoses(geo, base),
    folhas: calcularFolhas(geo),
    perc: montarPercurso(geo),
    centro: atrasoDoCentro(base),
  }
}

/** Pose dos itens e das folhas para o progresso atual. */
function poseDoQuadro(m: Medida, quadro: QuadroVivo, estado: Estado): void {
  const { de, para, t, trecho } = trechoAtual(estado.p)
  if (!trecho && de === 'erp') {
    erpEmQueda(m.poses.erp, m.base, estado.formar, quadro.pose, m.geo.erp.lh * 9)
  } else if (!trecho) {
    quadro.pose.set(m.poses[de])
  } else {
    const amplitude = Math.min(m.geo.area.w, m.geo.area.h) * 0.06 * trecho.arco
    const atrasos = trecho.atraso === 'centro' ? m.centro : m.base.sementes
    misturarItens(m.poses[de], m.poses[para], t, quadro.pose, atrasos, m.base.sementes, amplitude)
  }
  if (trecho) misturarFolhas(m.folhas[de], m.folhas[para], t, quadro.folhas)
  else quadro.folhas.set(m.folhas[de])
}

/**
 * Campo vivo: a onda de atualização segue a ponta do traço sob o campo; uma respiração lenta; e a
 * célula do comprovante fica marinho depois da baixa.
 */
function corDoCampo(m: Medida, q: Quadro, tempo: number): void {
  const k = faixa(q.p, 0.69, 0.715) * (1 - faixa(q.p, 0.905, 0.935))
  if (k <= 0) return
  const frente = frenteDaOnda(q)
  const largura = m.geo.campo.passoX * 2.5
  const baixa = faixa(q.p, 0.762, 0.775)
  const { base } = m
  const { avulsas } = m.geo
  for (let i = 0; i < base.n; i++) {
    const o = i * CAMPOS
    const x = q.pose[o]
    const alvo = x > frente ? base.nivelNovo[i] : base.nivel[i]
    const brilho = Math.exp(-(((x - frente) / largura) ** 2)) * 0.45
    const respiro = 0.035 * Math.sin(tempo * 1.3 + base.sementes[i] * 30)
    q.pose[o + 5] += (alvo - base.nivel[i] + brilho + respiro) * k
    if (i === avulsas.alvo) q.pose[o + 5] += (1 - q.pose[o + 5]) * baixa * k
  }
}

/** Um quadro: poses, traço, fundo e pintura. */
function pintar(
  m: Medida,
  quadro: QuadroVivo,
  estado: Estado,
  tempo: number,
  fundo: HTMLElement,
): void {
  poseDoQuadro(m, quadro, estado)
  const [cauda, cabeca] = trechoVisivel(m.perc, estado.p)
  const q: Quadro = { ...m, p: estado.p, cabeca, cauda, pose: quadro.pose, folhas: quadro.folhas }
  corDoCampo(m, q, tempo)
  pintarQuadro(m.c2d, q)
  // O palco começa em gelo (a cena anterior termina em gelo) e termina em branco limpo.
  const opacidade = Math.round((1 - suave(faixa(estado.p, 0.45, 0.95))) * 100) / 100
  if (opacidade !== quadro.fundo) {
    quadro.fundo = opacidade
    fundo.style.opacity = String(opacidade)
  }
}
