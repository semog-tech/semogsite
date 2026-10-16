import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import type Lenis from 'lenis'
import { formatarNumero, formatarPercentual } from '../formatar'
import { aoImprimir, type Reportar, registrarDesligamento } from './ganchos'
import { pausasDaTimeline, snapPatamares, soToque } from './patamares'

// Idempotente e seguro no SSR: o GSAP só inicia os plugins quando existe `window`.
gsap.registerPlugin(ScrollTrigger, SplitText)

/* Utilidades das cenas (ctx.util). Tudo que anda por quadro usa o ticker do GSAP (um único
   requestAnimationFrame na página). */

export { criarDinamica, type Dinamica, type OpcoesDinamica } from './dinamica'
export {
  aoImprimir,
  formatarNumero,
  formatarPercentual,
  pausasDaTimeline,
  registrarDesligamento,
  snapPatamares,
  soToque,
}

/* ---- Tela ---------------------------------------------------------------------- */

let consultaEstreita: MediaQueryList | null = null

/** Verdadeiro em tela estreita (até 760px), lido na hora. */
export function estreito(): boolean {
  consultaEstreita ??= window.matchMedia('(max-width: 760px)')
  return consultaEstreita.matches
}

/** Densidade de pixels limitada: 1,5 no celular, 2 no desktop. */
export function dprMaximo(): number {
  return Math.min(window.devicePixelRatio || 1, estreito() ? 1.5 : 2)
}

export type Pintura = { ctx: CanvasRenderingContext2D; w: number; h: number }

/** Ajusta o canvas 2D ao tamanho exibido, com DPR limitado; medidas em pixels CSS. */
export function prepararCanvas2D(canvas: HTMLCanvasElement): Pintura {
  const caixa = canvas.getBoundingClientRect()
  const dpr = dprMaximo()
  canvas.width = Math.max(1, Math.round(caixa.width * dpr))
  canvas.height = Math.max(1, Math.round(caixa.height * dpr))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D indisponível.')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, w: caixa.width, h: caixa.height }
}

/** Cor de um token hex do :root como [r, g, b] (0–255), para canvas e shader. */
export function corDoToken(nome: string): [number, number, number] {
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nome).trim()
  const achado = /^#([0-9a-f]{6})$/i.exec(valor)
  if (!achado) throw new Error(`Token ${nome} não é hex de 6 dígitos: "${valor}".`)
  const n = Number.parseInt(achado[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Família real de uma fonte do next/font (o nome muda no build), para `ctx.font` do canvas. */
export function familiaDaFonte(token: '--fonte-saira' | '--fonte-barlow'): string {
  const valor = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  if (!valor) throw new Error(`Token ${token} vazio: o next/font não aplicou a variável no <html>.`)
  return valor
}

/* ---- Rolagem e laços ----------------------------------------------------------- */

/** Chama `callback` no máximo uma vez por quadro enquanto houver rolagem ou resize. */
export function aoRolar(callback: () => void, lenis: Lenis | null = null): () => void {
  let sujo = true
  const marcar = () => {
    sujo = true
  }
  const tique = () => {
    if (!sujo) return
    sujo = false
    callback()
  }
  window.addEventListener('scroll', marcar, { passive: true })
  window.addEventListener('resize', marcar)
  const desligarLenis = lenis ? lenis.on('scroll', marcar) : () => {}
  gsap.ticker.add(tique)
  return registrarDesligamento(() => {
    window.removeEventListener('scroll', marcar)
    window.removeEventListener('resize', marcar)
    desligarLenis()
    gsap.ticker.remove(tique)
  })
}

/** Laço de desenho no ticker que só roda com o root na tela e a aba visível. */
export function lacoVisivel(root: Element, desenhar: (tempo: number) => void): () => void {
  let ativo = ScrollTrigger.isInViewport(root)
  const gatilho = ScrollTrigger.create({
    trigger: root,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      ativo = self.isActive
    },
  })
  const tique = (tempo: number) => {
    if (ativo && !document.hidden) desenhar(tempo)
  }
  gsap.ticker.add(tique)
  return registrarDesligamento(() => {
    gsap.ticker.remove(tique)
    gatilho.kill()
  })
}

/** Relógio que só anda com o root na tela e a aba visível (carrosséis, rodízios). */
export function relogioVisivel(
  root: Element,
  segundos: number,
  aoTicar: () => void,
  aoAlternar?: (pausado: boolean) => void,
): gsap.core.Tween {
  let visivel = ScrollTrigger.isInViewport(root)
  const relogio = gsap.to(
    {},
    { duration: segundos, repeat: -1, onRepeat: aoTicar, paused: !visivel },
  )
  const atualizar = () => {
    const pausado = document.hidden || !visivel
    if (relogio.paused() === pausado) return
    relogio.paused(pausado)
    aoAlternar?.(pausado)
  }
  ScrollTrigger.create({
    trigger: root,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      visivel = self.isActive
      atualizar()
    },
  })
  document.addEventListener('visibilitychange', atualizar)
  registrarDesligamento(() => document.removeEventListener('visibilitychange', atualizar))
  return relogio
}

/* ---- Entradas ------------------------------------------------------------------ */

export type OpcoesContador = {
  para: number
  de?: number
  formatar?: (valor: number) => string
  inteiro?: boolean
  duracao?: number
  gatilho?: Element | false
  inicio?: string
}

/** Conta de `de` até `para` em `el`. O HTML traz o valor final, para leitura sem JS. */
export function contador(el: HTMLElement, opcoes: OpcoesContador): gsap.core.Tween {
  const { para, de = 0, formatar = formatarNumero, inteiro = true, duracao = 1.4 } = opcoes
  const { gatilho = el, inicio = 'top 85%' } = opcoes
  if (!Number.isFinite(para) || !Number.isFinite(de)) {
    throw new TypeError("contador: 'para' e 'de' precisam ser números finitos.")
  }
  const estado = { valor: de }
  const escrever = (v: number) => {
    el.textContent = formatar(inteiro ? Math.round(v) : v)
  }
  const tween = gsap.to(estado, {
    valor: para,
    duration: duracao,
    ease: 'power2.out',
    onStart: () => escrever(de),
    onUpdate: () => escrever(estado.valor),
    onComplete: () => escrever(para),
    scrollTrigger: gatilho ? { trigger: gatilho, start: inicio, once: true } : undefined,
  })
  aoImprimir(() => {
    tween.progress(1)
    escrever(para)
  })
  return tween
}

export type OpcoesLote = {
  animar: (tl: gsap.core.Timeline, item: HTMLElement) => void
  inicio?: string
  cascata?: number
}

/** Cada item anima quando ELE entra na tela; os da mesma linha entram em cascata. */
export function entrarEmLote(alvos: gsap.DOMTarget, opcoes: OpcoesLote): gsap.core.Timeline[] {
  const { animar, inicio = 'top 85%', cascata = 0.12 } = opcoes
  const itens = gsap.utils.toArray<HTMLElement>(alvos)
  const entradas = itens.map((item) => {
    const tl = gsap.timeline({ paused: true })
    animar(tl, item)
    return tl
  })
  if (!itens.length) return entradas
  ScrollTrigger.batch(itens, {
    start: inicio,
    once: true,
    onEnter: (lote) => {
      lote.forEach((item, i) => {
        const tl = item instanceof HTMLElement ? entradas[itens.indexOf(item)] : undefined
        // play() numa timeline já no fim não faz nada: nada pisca de volta.
        if (tl) gsap.delayedCall(i * cascata, () => tl.play())
      })
    },
  })
  aoImprimir(() => {
    for (const tl of entradas) tl.progress(1)
  })
  return entradas
}

export type OpcoesRevelacao = {
  tipo?: 'linhas' | 'palavras'
  gatilho?: Element | false
  inicio?: string
  scrub?: boolean | number
  fim?: string
  duracao?: number
  stagger?: number
  atraso?: number
}

/**
 * Toca uma vez e não volta, SEM `once`: o SplitText recria este gatilho quando a fonte chega
 * ou a largura muda, às vezes com a página já rolada, e um `once` que já passou se mata no meio
 * do refresh (o GSAP lê `.end` de um índice que sumiu). Com toggleActions ele fica vivo.
 */
function gatilhoRevelacao(gatilho: Element | false, o: OpcoesRevelacao) {
  if (!gatilho) return undefined
  const base = { trigger: gatilho, start: o.inicio ?? 'top 80%' }
  if (o.scrub === undefined || o.scrub === false) {
    return { ...base, toggleActions: 'play none none none' }
  }
  return { ...base, end: o.fim ?? 'bottom 45%', scrub: o.scrub === true ? 1 : o.scrub }
}

/** Peso variável de 250 a 650 nos `.peso` de dentro do elemento, na mesma timeline. */
function animarPesos(tl: gsap.core.Timeline, el: HTMLElement): void {
  const pesos = el.querySelectorAll('.peso')
  if (!pesos.length) return
  tl.fromTo(
    pesos,
    { fontVariationSettings: '"wght" 250' },
    { fontVariationSettings: '"wght" 650', duration: 1.5, ease: 'power2.inOut' },
    0.45,
  )
}

/** Revela texto por máscara, linha a linha ou palavra a palavra; refaz sozinho ao mudar a largura. */
export function revelarTexto(el: HTMLElement, opcoes: OpcoesRevelacao = {}): SplitText {
  const porLinha = (opcoes.tipo ?? 'linhas') === 'linhas'
  const { gatilho = el, duracao = 0.9, atraso = 0 } = opcoes
  let atual: gsap.core.Timeline | null = null
  aoImprimir(() => atual?.progress(1))
  return SplitText.create(el, {
    type: porLinha ? 'lines' : 'words',
    mask: porLinha ? 'lines' : 'words',
    autoSplit: true,
    linesClass: 'revela-linha',
    wordsClass: 'revela-palavra',
    onSplit(self) {
      atual = gsap.timeline({ delay: atraso, scrollTrigger: gatilhoRevelacao(gatilho, opcoes) })
      atual.from(porLinha ? self.lines : self.words, {
        yPercent: 110,
        duration: duracao,
        ease: 'expo.out',
        stagger: opcoes.stagger ?? (porLinha ? 0.08 : 0.04),
      })
      animarPesos(atual, el)
      return atual
    },
  })
}

/** Quadro de foto: a moldura abre de baixo, a imagem assenta de um zoom e tem parallax. */
export function revelarQuadro(quadro: HTMLElement, reportar: Reportar): gsap.core.Timeline | null {
  const moldura = quadro.querySelector('.moldura')
  const imagem = moldura?.querySelector('img')
  if (!moldura || !imagem) {
    // A cena chama `ctx.reportar`: a origem final fica `cena:<id>:quadro` no Sentry.
    reportar(new Error('[revelarQuadro] quadro sem .moldura > img.'), 'quadro')
    return null
  }
  const tl = gsap
    .timeline({ scrollTrigger: { trigger: quadro, start: 'top 82%', once: true } })
    .fromTo(
      moldura,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' },
    )
    .from(imagem, { scale: 1.3, duration: 1.8, ease: 'expo.out' }, 0.2)
  const legenda = quadro.querySelector('figcaption')
  if (legenda) {
    tl.from(legenda, { yPercent: 40, autoAlpha: 0, duration: 0.9, ease: 'expo.out' }, 0.9)
  }
  gsap.fromTo(
    imagem,
    { yPercent: -5 },
    {
      yPercent: 5,
      ease: 'none',
      scrollTrigger: { trigger: moldura, start: 'top bottom', end: 'bottom top', scrub: 0.7 },
    },
  )
  aoImprimir(() => tl.progress(1))
  return tl
}

/** Troca um texto curto por máscara. O pai precisa ter overflow: clip. */
export function trocarTexto(el: HTMLElement, texto: string): gsap.core.Timeline {
  return gsap
    .timeline()
    .to(el, { yPercent: -110, duration: 0.5, ease: 'expo.in' })
    .call(() => {
      el.textContent = texto
    })
    .fromTo(el, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out' })
}

/* ---- Pin ----------------------------------------------------------------------- */

export type OpcoesPin = {
  alvo?: HTMLElement
  distancia?: string | number
  scrub?: boolean | number
  inicio?: string
  /** Onde o toque assenta: "pausas" (da coreografia) ou uma função com progressos de 0 a 1. */
  patamares?: 'pausas' | (() => number[])
  aoAtualizar?: (self: ScrollTrigger) => void
}

/**
 * Pin + scrub padronizado (timeline com ease "none" ligada à rolagem). Crie no init, de forma
 * síncrona: os pins são calculados na ordem de criação. Os patamares ficam em
 * `data-patamares` no alvo, para as verificações.
 */
export function pinScrub(root: HTMLElement, opcoes: OpcoesPin = {}): gsap.core.Timeline {
  const alvo = opcoes.alvo ?? root
  const { patamares } = opcoes
  // A timeline ainda não existe aqui: os pontos são lidos depois, quando a cena já a montou.
  let tl: gsap.core.Timeline | null = null
  const progressos = (): number[] => {
    if (patamares === 'pausas') return tl ? pausasDaTimeline(tl) : [0, 1]
    return patamares ? patamares() : []
  }
  tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: alvo,
      pin: alvo,
      start: opcoes.inicio ?? 'top top',
      end: opcoes.distancia ?? '+=150%',
      scrub: opcoes.scrub ?? 0.7,
      snap: patamares ? snapPatamares(progressos) : undefined,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: opcoes.aoAtualizar,
      onRefresh: patamares
        ? () => {
            alvo.dataset.patamares = progressos()
              .map((p) => p.toFixed(4))
              .join(' ')
          }
        : undefined,
    },
  })
  return tl
}
