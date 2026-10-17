import type { ContextoCena } from '@/site/core/tipos'

/**
 * Cena da comunidade, o mundo escuro da página. Uma linha marinho se desenha no gelo em que as
 * Unidades terminam; as folhas de gelo se afastam dela e revelam a noite, a linha vira luz e, ao
 * lado, sobem o título e a agenda dos dois encontros. A mesma linha desce pelos capítulos (Café
 * com Condomínio, maior; Semog Experience, menor; o blog), com a ponta na linha de leitura. As
 * fotos (e o reel do Experience 26) abrem em cinema e ganham luz. Na saída, as duas metades
 * claras da proposta (38,2/61,8) sobem e recolhem a noite.
 */
export function cenaComunidade(ctx: ContextoCena): void {
  const temaOriginal = ctx.root.dataset.tema ?? 'marinho'
  // Se a cena quebrar ou desmontar com a noite ainda fechada, a seção volta ao tema da marcação.
  ctx.util.registrarDesligamento(() => {
    ctx.root.dataset.tema = temaOriginal
  })
  abrirNoite(ctx)
  respirarNoite(ctx)
  entrarCafe(ctx)
  entrarExperience(ctx)
  entrarTextos(ctx, exigir(ctx.root, '.comunidade-blog'))
  ligarPercurso(ctx)
  recolherNoite(ctx)
}

function exigir(raiz: ParentNode, seletor: string): Element {
  const el = raiz.querySelector(seletor)
  if (!(el instanceof Element)) throw new Error(`[cena comunidade] falta ${seletor}.`)
  return el
}

function exigirHtml(raiz: ParentNode, seletor: string): HTMLElement {
  const el = raiz.querySelector(seletor)
  if (!(el instanceof HTMLElement)) throw new Error(`[cena comunidade] falta ${seletor}.`)
  return el
}

/* ---- Abertura ---------------------------------------------------------------- */

/**
 * A abertura acompanha a chegada da cena, sem pin: a linha marinho se desenha no gelo e, logo
 * atrás, as folhas se afastam dela e revelam a noite; a linha vira luz; título, subtítulo e
 * agenda entram enquanto abre, para nenhum quadro ficar só com a linha. O header acompanha: gelo
 * até a noite tomar a tela, marinho depois.
 */
function abrirNoite(ctx: ContextoCena): void {
  const { gsap, root } = ctx
  const abertura = exigir(root, '.comunidade-abertura')
  /** Progresso → entrada (cada uma toca uma vez). */
  const passos: Array<[number, () => void]> = [
    [0.36, entradaPorLinhas(ctx, exigirHtml(abertura, 'h2'), 'perto').tocar],
    [0.46, entradaPorLinhas(ctx, exigirHtml(abertura, '.lead')).tocar],
    [0.52, entradaAgenda(ctx, exigir(abertura, '.comunidade-agenda')).tocar],
  ]
  root.dataset.tema = 'gelo'
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: abertura,
      start: 'top 92%',
      end: 'top 12%',
      scrub: 0.7,
      onUpdate: (self) => {
        root.dataset.tema = self.progress > 0.6 ? 'marinho' : 'gelo'
        for (const [limite, tocar] of passos) if (self.progress >= limite) tocar()
      },
    },
  })
  const abrir = { duration: 0.62, ease: 'power3.inOut' }
  tl.fromTo('.comunidade-fio--escuro', { scaleY: 0, opacity: 1 }, { scaleY: 1, duration: 0.3 }, 0)
    .fromTo('.comunidade-folha--esq', { x: 0, xPercent: 0 }, { xPercent: -100, ...abrir }, 0.22)
    .fromTo('.comunidade-folha--dir', { x: 0, xPercent: 0 }, { xPercent: 100, ...abrir }, 0.22)
    .to('.comunidade-fio--escuro', { opacity: 0, duration: 0.22 }, 0.36)
    .fromTo('.comunidade-fio--luz', { opacity: 0 }, { opacity: 1, duration: 0.22 }, 0.36)
    .to({}, { duration: 0.16 })
}

/**
 * Bloco oculto até `tocar()`; aí sobe por linha (dividido na hora, com as fontes já carregadas) e
 * a `palavra`, se houver, ganha peso. No fim a divisão é desfeita, para o texto voltar a quebrar
 * sozinho. Toca uma vez só; na impressão aparece inteiro.
 */
function entradaPorLinhas(ctx: ContextoCena, el: HTMLElement, palavra?: string) {
  const { gsap, SplitText, util } = ctx
  if (palavra) envolverPalavra(ctx, el, palavra)
  gsap.set(el, { visibility: 'hidden' })
  let tocou = false
  const tocar = () => {
    if (tocou) return
    tocou = true
    gsap.set(el, { visibility: 'visible' })
    const divisao = SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'revela-linha',
    })
    const tl = gsap.timeline({ onComplete: () => divisao.revert() })
    tl.from(divisao.lines, { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.1 })
    const pesos = el.querySelectorAll('.peso')
    if (pesos.length) {
      tl.fromTo(
        pesos,
        { fontVariationSettings: '"wght" 250' },
        { fontVariationSettings: '"wght" 650', duration: 1.5, ease: 'power2.inOut' },
        0.45,
      )
    }
  }
  util.aoImprimir(() => {
    if (!tocou) gsap.set(el, { visibility: 'visible' })
  })
  return { tocar }
}

/**
 * Agenda dos dois encontros: cada estação sai da linha (traço curto) e as linhas de texto sobem
 * por máscara logo atrás.
 */
function entradaAgenda({ gsap, util }: ContextoCena, agenda: Element) {
  gsap.set(agenda, { visibility: 'hidden' })
  let tocou = false
  const tocar = () => {
    if (tocou) return
    tocou = true
    gsap.set(agenda, { visibility: 'visible' })
    const tl = gsap.timeline()
    agenda.querySelectorAll('.comunidade-agenda-item').forEach((item, i) => {
      tl.fromTo(
        item.querySelector('.comunidade-marca'),
        { scaleX: 0 },
        { scaleX: 1, duration: 0.8, ease: 'expo.out' },
        i * 0.22,
      ).from(
        item.querySelectorAll('.linha-interna'),
        { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.08 },
        i * 0.22 + 0.12,
      )
    })
  }
  util.aoImprimir(() => {
    if (!tocou) gsap.set(agenda, { visibility: 'visible' })
  })
  return { tocar }
}

/**
 * Envolve a primeira ocorrência de `palavra` num `.peso`, sem reescrever o texto (que vem do
 * conteúdo tipado). O que o React renderizou volta no desmonte. Sem a palavra, segue sem ênfase,
 * e o aviso vai ao Sentry.
 */
function envolverPalavra({ util, reportar }: ContextoCena, el: HTMLElement, palavra: string) {
  const caminhante = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  for (let no = caminhante.nextNode(); no; no = caminhante.nextNode()) {
    if (!(no instanceof Text)) continue
    const i = no.data.indexOf(palavra)
    if (i < 0) continue
    const original = no.data
    const alvo = no.splitText(i)
    const resto = alvo.splitText(palavra.length)
    const enfase = document.createElement('em')
    enfase.className = 'peso'
    alvo.replaceWith(enfase)
    enfase.append(alvo)
    // O nó de texto do React foi partido em três: volta inteiro, sem a ênfase.
    util.registrarDesligamento(() => {
      no.data = original
      enfase.remove()
      resto.remove()
    })
    return
  }
  reportar(
    new Error(`[cena comunidade] "${palavra}" não está no texto; segue sem ênfase.`),
    'enfase',
  )
}

/* ---- Noite ------------------------------------------------------------------- */

/** Os brilhos da noite derivam devagar; só andam com a cena na tela. */
function respirarNoite({ gsap, ScrollTrigger, root }: ContextoCena): void {
  const deriva = { ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true }
  const derivas = [
    gsap.to('.comunidade-brilho--a', { xPercent: 14, yPercent: 10, duration: 16, ...deriva }),
    gsap.to('.comunidade-brilho--b', { xPercent: -12, yPercent: -8, duration: 19, ...deriva }),
  ]
  ScrollTrigger.create({
    trigger: root,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      for (const d of derivas) d.paused(!self.isActive)
    },
  })
}

/* ---- Capítulos --------------------------------------------------------------- */

function entrarCafe(ctx: ContextoCena): void {
  const { gsap, root, util } = ctx
  const quadro = exigir(root, '.comunidade-quadro--cafe')
  abrirFoto(ctx, quadro, () => fendaNaLinha(root, quadro))
  entrarTextos(ctx, exigir(root, '.comunidade-cafe'))
  const frase = exigirHtml(root, '.comunidade-frase')
  envolverPalavra(ctx, frase, 'protagonista')
  util.revelarTexto(frase, { stagger: 0.1, duracao: 1.1 })
  gsap.from('.comunidade-aspas', {
    scale: 0,
    duration: 1.4,
    ease: 'expo.out',
    scrollTrigger: { trigger: exigir(root, '.comunidade-mote'), start: 'top 80%', once: true },
  })
}

/** A foto do Café abre de uma fenda no x da linha: é a linha que abre a foto. */
function fendaNaLinha(root: HTMLElement, quadro: Element): string {
  const linha = exigir(root, '.comunidade-fio--luz').getBoundingClientRect()
  const caixa = quadro.getBoundingClientRect()
  const p = Math.min(100, Math.max(0, ((linha.left - caixa.left) / caixa.width) * 100))
  return `inset(0% ${100 - p}% 0% ${p}%)`
}

/**
 * Foto em cinema: a moldura abre (de uma fenda ou de baixo), a imagem (ou o reel) assenta do zoom,
 * a sombra marinho sai (a foto ganha luz) e depois a imagem desliza com a rolagem. `fechada` dá o
 * clip-path inicial da moldura.
 */
function abrirFoto({ gsap, util }: ContextoCena, quadro: Element, fechada: () => string): void {
  const moldura = exigir(quadro, '.moldura')
  const imagem = exigir(moldura, 'img, video')
  const tl = gsap
    .timeline({ scrollTrigger: { trigger: quadro, start: 'top 82%', once: true } })
    .fromTo(
      moldura,
      { clipPath: fechada },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' },
    )
    .from(imagem, { scale: 1.3, duration: 1.8, ease: 'expo.out' }, 0.2)
    .fromTo(
      exigir(moldura, '.comunidade-sombra'),
      { opacity: 0.8 },
      { opacity: 0, duration: 1.6, ease: 'power2.out' },
      0.5,
    )
  const legenda = quadro.querySelector(':scope > figcaption')
  if (legenda) revelarLegenda(tl, legenda, 0.9)
  gsap.fromTo(
    imagem,
    { yPercent: -5 },
    {
      yPercent: 5,
      ease: 'none',
      scrollTrigger: { trigger: moldura, start: 'top bottom', end: 'bottom top', scrub: 0.7 },
    },
  )
  util.aoImprimir(() => tl.progress(1))
}

/** Legenda curta abre da esquerda por máscara. */
function revelarLegenda(tl: gsap.core.Timeline, legenda: Element, em: number): void {
  tl.fromTo(
    legenda,
    { clipPath: 'inset(0% 100% 0% 0%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'expo.out' },
    em,
  )
}

function entrarExperience(ctx: ContextoCena): void {
  const { gsap, root } = ctx
  for (const quadro of Array.from(root.querySelectorAll('.comunidade-quadro--retrato'))) {
    abrirFoto(ctx, quadro, () => 'inset(100% 0% 0% 0%)')
  }
  const dupla = exigir(root, '.comunidade-dupla')
  const tl = gsap.timeline({ scrollTrigger: { trigger: dupla, start: 'top 45%', once: true } })
  revelarLegenda(tl, exigir(dupla, ':scope > figcaption'), 0)
  entrarTextos(ctx, exigir(root, '.comunidade-experience'))
}

/**
 * Textos de um bloco: títulos e parágrafos por linha; nos marcos, rótulo e data sobem por máscara
 * em sequência; o link abre da esquerda.
 */
function entrarTextos({ gsap, util }: ContextoCena, bloco: Element): void {
  const textos = bloco.querySelectorAll(
    'h3, .comunidade-corpo, .comunidade-nota, .comunidade-voz p, .comunidade-voz figcaption',
  )
  for (const el of Array.from(textos)) {
    if (el instanceof HTMLElement) util.revelarTexto(el)
  }
  for (const marco of Array.from(bloco.querySelectorAll('.comunidade-marco'))) {
    gsap.from(marco.querySelectorAll('.linha-interna'), {
      yPercent: 110,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.09,
      scrollTrigger: { trigger: marco, start: 'top 82%', once: true },
    })
  }
  for (const link of Array.from(bloco.querySelectorAll('.link-seta'))) {
    gsap.fromTo(
      link,
      { clipPath: 'inset(0% 100% 0% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1,
        ease: 'expo.out',
        clearProps: 'clipPath',
        scrollTrigger: { trigger: link, start: 'top 88%', once: true },
      },
    )
  }
}

/* ---- Saída ------------------------------------------------------------------- */

/**
 * As metades claras sobem do pé da cena, a menor (38,2) na frente, e recolhem a noite antes de a
 * costura com a proposta entrar na tela (terminam com o topo da saída a 75%): no fim da cena tudo
 * é branco, como o topo da proposta. O header volta a claro junto.
 */
function recolherNoite({ gsap, ScrollTrigger, root }: ContextoCena): void {
  const saida = exigir(root, '.comunidade-saida')
  gsap
    .timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: { trigger: saida, start: 'top bottom', end: 'top 75%', scrub: 0.7 },
    })
    .fromTo('.comunidade-metade--menor', { scaleY: 0 }, { scaleY: 1, duration: 0.85 }, 0)
    .fromTo('.comunidade-metade--maior', { scaleY: 0 }, { scaleY: 1, duration: 0.85 }, 0.15)
  ScrollTrigger.create({
    trigger: saida,
    start: 'top top+=68',
    onEnter: () => {
      root.dataset.tema = 'claro'
    },
    onLeaveBack: () => {
      root.dataset.tema = 'marinho'
    },
  })
}

/* ---- Traço contínuo ---------------------------------------------------------- */

const LINHA_DE_LEITURA = '62%'
/** Vão entre as metades (--e5). */
const VAO = 55

type Medida = {
  /** Comprimento do path. */
  total: number
  /** Amostras de comprimento. */
  comprimentos: number[]
  /** y de cada amostra, sempre crescente. */
  alturas: number[]
}

/**
 * Um único path liga a linha da abertura ao Café, ao Experience e ao blog. A ponta segue a linha
 * de leitura: a rolagem (com scrub) dá a altura y dessa linha dentro dos capítulos, e uma tabela
 * y → comprimento diz quanto do traço já foi desenhado.
 */
function ligarPercurso({ gsap, ScrollTrigger, root, estreito, util }: ContextoCena): void {
  const capitulos = exigirHtml(root, '.comunidade-capitulos')
  const svg = exigir(capitulos, '.comunidade-percurso')
  const path = svg.querySelector('path')
  if (!(path instanceof SVGPathElement)) throw new Error('[cena comunidade] falta o path.')
  const ponta = svg.querySelector('.comunidade-ponta')
  if (!(ponta instanceof SVGElement)) throw new Error('[cena comunidade] falta .comunidade-ponta.')
  const leitura = { y: 0 }
  let medida: Medida = { total: 0, comprimentos: [], alturas: [] }
  const aplicar = () => desenharAte(path, ponta, medida, leitura.y)
  const medir = () => {
    medida = medirPercurso(root, capitulos, svg, path, estreito())
    aplicar()
  }
  medir()
  ScrollTrigger.addEventListener('refresh', medir)
  // Atributos e estilo postos fora do GSAP no SVG do React: saem no desmonte, com o ouvinte.
  util.registrarDesligamento(() => {
    ScrollTrigger.removeEventListener('refresh', medir)
    desfazerPercurso(svg, path, ponta)
  })
  gsap.to(leitura, {
    y: () => capitulos.offsetHeight,
    ease: 'none',
    onUpdate: aplicar,
    scrollTrigger: {
      trigger: capitulos,
      start: `top ${LINHA_DE_LEITURA}`,
      end: `bottom ${LINHA_DE_LEITURA}`,
      scrub: 0.7,
      invalidateOnRefresh: true,
    },
  })
}

function desfazerPercurso(svg: Element, path: SVGPathElement, ponta: SVGElement): void {
  for (const nome of ['width', 'height', 'viewBox']) svg.removeAttribute(nome)
  path.removeAttribute('d')
  path.style.removeProperty('stroke-dasharray')
  path.style.removeProperty('stroke-dashoffset')
  ponta.style.removeProperty('opacity')
  ponta.removeAttribute('x')
  ponta.removeAttribute('y')
}

/** Recalcula o desenho do path para o layout atual e a tabela y → comprimento. */
function medirPercurso(
  root: HTMLElement,
  capitulos: HTMLElement,
  svg: Element,
  path: SVGPathElement,
  estreita: boolean,
): Medida {
  const caixa = capitulos.getBoundingClientRect()
  svg.setAttribute('width', String(caixa.width))
  svg.setAttribute('height', String(caixa.height))
  svg.setAttribute('viewBox', `0 0 ${caixa.width} ${caixa.height}`)
  path.setAttribute('d', tracarPercurso(root, caixa, estreita))
  const total = path.getTotalLength()
  const comprimentos: number[] = []
  const alturas: number[] = []
  let maior = 0
  for (let l = 0; l <= total; l += 4) {
    maior = Math.max(maior, path.getPointAtLength(l).y)
    comprimentos.push(l)
    alturas.push(maior)
  }
  path.style.strokeDasharray = String(total)
  return { total, comprimentos, alturas }
}

/**
 * Pontos do traço, em coordenadas dos capítulos: desce da linha da abertura passando por trás da
 * foto do Café, corre no vão entre mote e texto, curva para o vão do Experience e termina virando
 * para o título do blog.
 */
function tracarPercurso(root: HTMLElement, caixa: DOMRect, estreita: boolean): string {
  const rel = (seletor: string) => {
    const r = exigir(root, seletor).getBoundingClientRect()
    return { x: r.left - caixa.left, y: r.top - caixa.top, r: r.right - caixa.left, h: r.height }
  }
  const centro = rel('.comunidade-fio--luz').x + 0.5
  const par = rel('.comunidade-cafe .comunidade-par')
  const cafe = rel('.comunidade-cafe')
  const experience = rel('.comunidade-experience')
  const blog = rel('.comunidade-blog h3')
  const g1 = estreita
    ? 1
    : medio(rel('.comunidade-mote').r, rel('.comunidade-cafe .comunidade-texto').x)
  const g2 = estreita ? 1 : rel('.comunidade-experience .comunidade-texto').r + VAO / 2
  const fimY = blog.y + blog.h / 2
  const fimX = blog.x - 8
  const raio = Math.min(34, fimX - g2)
  const curva = (x0: number, y0: number, x1: number, y1: number) =>
    `C ${x0} ${medio(y0, y1)} ${x1} ${medio(y0, y1)} ${x1} ${y1}`
  const volta =
    raio < 4
      ? `V ${fimY}`
      : `V ${fimY - raio} C ${g2} ${fimY - raio * 0.45} ${g2 + raio * 0.45} ${fimY} ${g2 + raio} ${fimY} H ${fimX}`
  return [
    `M ${centro} 0`,
    curva(centro, 0, g1, par.y),
    `V ${cafe.y + cafe.h}`,
    curva(g1, cafe.y + cafe.h, g2, experience.y),
    volta,
  ].join(' ')
}

function medio(a: number, b: number): number {
  return (a + b) / 2
}

/** Comprimento já desenhado quando a linha de leitura está na altura y. */
function comprimentoAte(medida: Medida, y: number): number {
  const { total, comprimentos, alturas } = medida
  if (y <= 0 || !alturas.length) return 0
  const ultimo = alturas[alturas.length - 1]
  if (y > ultimo) {
    // Depois da última altura só resta o trecho horizontal: ele anda com a rolagem.
    const inicio = comprimentos[alturas.indexOf(ultimo)]
    return Math.min(total, inicio + (y - ultimo))
  }
  let baixo = 0
  let alto = alturas.length - 1
  while (baixo < alto) {
    const meio = (baixo + alto) >> 1
    if (alturas[meio] < y) baixo = meio + 1
    else alto = meio
  }
  return comprimentos[baixo]
}

function desenharAte(path: SVGPathElement, ponta: SVGElement, medida: Medida, y: number): void {
  const feito = comprimentoAte(medida, y)
  path.style.strokeDashoffset = String(medida.total - feito)
  const andando = feito > 0 && feito < medida.total
  ponta.style.opacity = andando ? '1' : '0'
  if (!andando) return
  const p = path.getPointAtLength(feito)
  ponta.setAttribute('x', String(p.x - 3))
  ponta.setAttribute('y', String(p.y - 3))
}
