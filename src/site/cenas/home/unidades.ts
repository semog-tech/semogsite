import type { ContextoCena } from '@/site/core/tipos'

/**
 * Cena das Unidades, "perto de cada condomínio". As quatro Unidades em grade áurea alternada:
 * cada moldura abre por cortina reta e a foto assenta do zoom; o nome da cidade sobe por máscara
 * e a avaliação do Google entra linha a linha. Uma única rota, medida nos pontos reais do DOM,
 * corre no vão entre foto e texto de Recife a Belém (na margem, no celular): a ponta acompanha a
 * rolagem e, ao chegar a uma cidade, o marco enche e o nome ganha peso.
 */
export function cenaUnidades(ctx: ContextoCena): void {
  const { gsap, root, util, estreito } = ctx
  const titulo = root.querySelector('.unidades-titulo')
  if (titulo instanceof HTMLElement) {
    // O texto é do React: os nós de antes voltam no desmonte (ou se a cena quebrar).
    util.registrarDesligamento(enfatizarTitulo(titulo))
    util.revelarTexto(titulo, { duracao: 1.1 })
  }
  const lead = root.querySelector('.unidades-lead')
  if (lead instanceof HTMLElement) {
    util.revelarTexto(lead, { gatilho: titulo ?? lead, atraso: 0.45 })
  }
  const unidades = Array.from(root.querySelectorAll<HTMLElement>('.unidade'))
  for (const unidade of unidades) revelarUnidade(ctx, unidade, estreito())
  ligarRota(ctx, unidades)
  revelarAviso(gsap, root)
}

/**
 * O trecho depois da vírgula do título ("perto de cada condomínio.") vira a ênfase por peso. O
 * texto vem do conteúdo tipado; sem vírgula, o título fica como está. Devolve o que desfaz.
 */
function enfatizarTitulo(titulo: HTMLElement): () => void {
  const originais = Array.from(titulo.childNodes)
  const repor = () => titulo.replaceChildren(...originais)
  const texto = (titulo.textContent ?? '').trim()
  const corte = texto.indexOf(', ')
  if (corte < 0) return repor
  const enfase = document.createElement('em')
  enfase.className = 'peso'
  enfase.textContent = texto.slice(corte + 2)
  titulo.textContent = texto.slice(0, corte + 2)
  titulo.append(enfase)
  return repor
}

/**
 * Entrada encadeada de uma Unidade: moldura e foto (core), depois o nome da cidade por máscara, a
 * linha da Unidade e o link, e por fim cada avaliação. Lado a lado, o texto espera a cortina
 * andar; empilhado, cada bloco entra quando ele chega à tela.
 */
function revelarUnidade(ctx: ContextoCena, unidade: HTMLElement, empilhado: boolean): void {
  const { gsap, util } = ctx
  const quadro = unidade.querySelector('.unidade-quadro')
  if (quadro instanceof HTMLElement) util.revelarQuadro(quadro, ctx.reportar)
  const cidade = unidade.querySelector('.unidade-cidade')
  const gatilho = empilhado ? cidade : unidade
  const atraso = empilhado ? 0 : 0.5
  if (cidade instanceof HTMLElement && gatilho) {
    util.revelarTexto(cidade, { gatilho, inicio: 'top 82%', atraso, duracao: 1.2 })
  }
  gsap.fromTo(
    unidade.querySelectorAll('.unidade-uf, .unidade-link'),
    { clipPath: 'inset(0% 0% 100% 0%)', y: 21 },
    {
      clipPath: 'inset(0% 0% -20% 0%)',
      y: 0,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.1,
      delay: atraso + 0.45,
      scrollTrigger: { trigger: gatilho ?? unidade, start: 'top 82%', once: true },
    },
  )
  for (const voz of Array.from(unidade.querySelectorAll('.voz'))) {
    if (voz instanceof HTMLElement) revelarVoz(ctx, voz, empilhado ? 0 : 0.3)
  }
}

/** Aspas desenhadas da esquerda, citação linha a linha por máscara, autoria por último. */
function revelarVoz({ gsap, util }: ContextoCena, voz: HTMLElement, atraso: number): void {
  const scrollTrigger = { trigger: voz, start: 'top 85%', once: true }
  const aspas = voz.querySelector('.voz-aspas')
  if (aspas) {
    gsap.fromTo(
      aspas,
      { clipPath: 'inset(0% 100% 0% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 0.8,
        ease: 'expo.out',
        delay: atraso,
        scrollTrigger,
      },
    )
  }
  const texto = voz.querySelector('.voz-texto p')
  if (texto instanceof HTMLElement) {
    util.revelarTexto(texto, {
      gatilho: voz,
      inicio: 'top 85%',
      atraso: atraso + 0.2,
      duracao: 1.1,
    })
  }
  const autor = voz.querySelector('.voz-autor')
  if (autor) {
    gsap.fromTo(
      autor,
      { clipPath: 'inset(0% 0% 100% 0%)', y: 13 },
      {
        clipPath: 'inset(0% 0% -20% 0%)',
        y: 0,
        duration: 0.9,
        ease: 'expo.out',
        delay: atraso + 0.75,
        scrollTrigger,
      },
    )
  }
}

function revelarAviso(gsap: ContextoCena['gsap'], root: HTMLElement): void {
  const aviso = root.querySelector('.unidades-aviso')
  if (!aviso) return
  gsap.fromTo(
    aviso,
    { clipPath: 'inset(0% 100% 0% 0%)' },
    {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: { trigger: aviso, start: 'top 92%', once: true },
    },
  )
}

/* ---- Rota ---------------------------------------------------------------------- */

const SVG = 'http://www.w3.org/2000/svg'
const LADO_MARCO = 9
const LADO_MARCO_MARGEM = 7
const LADO_PONTA = 5
const AMOSTRAS = 320

type Parada = {
  /** Coluna da rota nesta Unidade (vão entre foto e texto, ou margem). */
  x: number
  /** Topo da Unidade. */
  topo: number
  /** Altura do marco: meio da primeira linha do nome da cidade. */
  marco: number
  /** Pé da Unidade. */
  fim: number
}
type Amostra = { y: number; c: number }
type Rota = ReturnType<typeof montarRota>

function exigir<T extends Element>(el: T | null, seletor: string): T {
  if (!el) throw new Error(`[cena unidades] falta ${seletor}.`)
  return el
}

/**
 * Liga a rota à rolagem: a ponta fica sempre na linha de 62% da tela, convertida em comprimento
 * do traço por uma tabela altura → comprimento (o traço só desce, então a altura é monótona ao
 * longo dele). Scrub 0,7 suaviza.
 */
function ligarRota(ctx: ContextoCena, unidades: HTMLElement[]): void {
  const { gsap, ScrollTrigger, util, root } = ctx
  const lista = root.querySelector('.unidades-lista')
  const svg = lista?.querySelector('.unidades-rota')
  if (!(lista instanceof HTMLElement) || !(svg instanceof SVGSVGElement) || !unidades.length) {
    ctx.reportar(new Error('[cena unidades] lista ou rota ausente; segue sem a rota.'), 'rota')
    return
  }
  const rota = montarRota(svg, unidades.length)
  util.registrarDesligamento(() => desfazerRota(rota, unidades))
  const estado = { progresso: 0 }
  const aplicar = () => aplicarRota(rota, unidades, estado.progresso)
  const remedir = () => {
    medirRota(rota, { root, lista }, unidades)
    aplicar()
  }
  ScrollTrigger.addEventListener('refresh', remedir)
  util.registrarDesligamento(() => {
    ScrollTrigger.removeEventListener('refresh', remedir)
  })
  remedir()
  gsap.to(estado, {
    progresso: 1,
    ease: 'none',
    onUpdate: aplicar,
    scrollTrigger: { trigger: lista, start: 'top 62%', end: 'bottom 62%', scrub: 0.7 },
  })
  util.aoImprimir(() => {
    estado.progresso = 1
    aplicar()
  })
}

function montarRota(svg: SVGSVGElement, quantidade: number) {
  const base = exigir(svg.querySelector<SVGPathElement>('.rota-base'), '.rota-base')
  const feita = exigir(svg.querySelector<SVGPathElement>('.rota-feita'), '.rota-feita')
  const grupo = exigir(svg.querySelector<SVGGElement>('.rota-marcos'), '.rota-marcos')
  const criar = (classe: string, lado: number): SVGRectElement => {
    const r = document.createElementNS(SVG, 'rect')
    r.setAttribute('class', classe)
    r.setAttribute('width', String(lado))
    r.setAttribute('height', String(lado))
    grupo.append(r)
    return r
  }
  const marcos = Array.from({ length: quantidade }, () => ({
    base: criar('marco-base', LADO_MARCO),
    cheio: criar('marco-cheio', LADO_MARCO),
  }))
  const ponta = criar('rota-ponta', LADO_PONTA)
  const paradas: Parada[] = []
  const tabela: Amostra[] = []
  return { base, feita, marcos, ponta, comprimento: 0, altura: 0, paradas, tabela }
}

/**
 * O que a rota pôs fora do GSAP sai com ela: os marcos e a ponta criados no `<g>` (senão uma
 * montagem nova os duplicaria), o traço e o estado de chegada das Unidades.
 */
function desfazerRota(rota: Rota, unidades: HTMLElement[]): void {
  for (const { base, cheio } of rota.marcos) {
    base.remove()
    cheio.remove()
  }
  rota.ponta.remove()
  for (const caminho of [rota.base, rota.feita]) caminho.removeAttribute('d')
  rota.feita.style.removeProperty('stroke-dasharray')
  rota.feita.style.removeProperty('stroke-dashoffset')
  for (const unidade of unidades) unidade.classList.remove('chegou')
}

/**
 * Lado a lado, a rota corre no meio do vão entre foto e texto; empilhado (celular), na metade da
 * margem esquerda da página, fora do conteúdo.
 */
function medirParada(unidade: HTMLElement, origem: DOMRect, margem: number): Parada {
  const caixa = (sel: string) => exigir(unidade.querySelector(sel), sel).getBoundingClientRect()
  const quadro = caixa('.unidade-quadro')
  const texto = caixa('.unidade-texto')
  const cidadeEl = exigir(unidade.querySelector('.unidade-cidade'), '.unidade-cidade')
  const cidade = cidadeEl.getBoundingClientRect()
  const empilhado = quadro.bottom <= texto.top + 1
  let x = -margem / 2
  if (!empilhado) {
    x = quadro.left < texto.left ? (quadro.right + texto.left) / 2 : (texto.right + quadro.left) / 2
    x -= origem.left
  }
  const linha = Number.parseFloat(getComputedStyle(cidadeEl).fontSize) * 0.95
  const total = unidade.getBoundingClientRect()
  return {
    x: Math.round(x) + 0.5,
    topo: total.top - origem.top,
    marco: cidade.top - origem.top + Math.min(linha, cidade.height) / 2,
    fim: total.bottom - origem.top,
  }
}

/**
 * Monta o traço: desce reto pela coluna da Unidade e, quando a coluna muda de lado, cruza em S
 * no respiro entre uma Unidade e a outra, sem passar sobre foto nem texto.
 */
function medirRota(
  rota: Rota,
  { root, lista }: { root: HTMLElement; lista: HTMLElement },
  unidades: HTMLElement[],
): void {
  const origem = lista.getBoundingClientRect()
  const margem = origem.left - root.getBoundingClientRect().left
  const p = unidades.map((u) => medirParada(u, origem, margem))
  let d = `M${p[0].x} ${p[0].marco}`
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1]
    const c = p[i]
    if (a.x !== c.x) {
      const meio = (a.fim + c.topo) / 2
      d += ` L${a.x} ${a.fim} C${a.x} ${meio} ${c.x} ${meio} ${c.x} ${c.topo}`
    }
    d += ` L${c.x} ${c.marco}`
  }
  rota.base.setAttribute('d', d)
  rota.feita.setAttribute('d', d)
  rota.comprimento = rota.base.getTotalLength()
  rota.altura = origem.height
  rota.paradas = p
  rota.tabela = tabelarAltura(rota.base, rota.comprimento)
  rota.feita.style.strokeDasharray = `${rota.comprimento}`
  posicionarMarcos(rota, p)
}

/**
 * Marcos centrados em cada parada; na margem do celular (x negativo) ficam menores, para não
 * encostar no nome da cidade.
 */
function posicionarMarcos(rota: Rota, paradas: Parada[]): void {
  paradas.forEach((parada, i) => {
    const lado = parada.x < 0 ? LADO_MARCO_MARGEM : LADO_MARCO
    for (const r of [rota.marcos[i].base, rota.marcos[i].cheio]) {
      r.setAttribute('width', String(lado))
      r.setAttribute('height', String(lado))
      r.setAttribute('x', String(parada.x - lado / 2))
      r.setAttribute('y', String(parada.marco - lado / 2))
    }
  })
}

function tabelarAltura(caminho: SVGPathElement, comprimento: number): Amostra[] {
  return Array.from({ length: AMOSTRAS + 1 }, (_, i) => {
    const c = (comprimento * i) / AMOSTRAS
    return { y: caminho.getPointAtLength(c).y, c }
  })
}

/** Comprimento do traço na altura y (busca binária na tabela, interpolação linear). */
function comprimentoNaAltura(tabela: Amostra[], y: number): number {
  if (!tabela.length || y <= tabela[0].y) return 0
  const ultimo = tabela[tabela.length - 1]
  if (y >= ultimo.y) return ultimo.c
  let baixo = 0
  let alto = tabela.length - 1
  while (alto - baixo > 1) {
    const meio = (baixo + alto) >> 1
    if (tabela[meio].y < y) baixo = meio
    else alto = meio
  }
  const a = tabela[baixo]
  const b = tabela[alto]
  const t = b.y === a.y ? 1 : (y - a.y) / (b.y - a.y)
  return a.c + (b.c - a.c) * t
}

/** `progresso` vai de 0 a 1 ao longo da lista. */
function aplicarRota(rota: Rota, unidades: HTMLElement[], progresso: number): void {
  if (!rota.comprimento) return
  const y = progresso * rota.altura
  const andado = comprimentoNaAltura(rota.tabela, y)
  rota.feita.style.strokeDashoffset = `${rota.comprimento - andado}`
  const ponto = rota.base.getPointAtLength(andado)
  rota.ponta.setAttribute('x', String(ponto.x - LADO_PONTA / 2))
  rota.ponta.setAttribute('y', String(ponto.y - LADO_PONTA / 2))
  rota.ponta.style.opacity = andado > 0 && andado < rota.comprimento - 0.5 ? '1' : '0'
  rota.paradas.forEach((parada, i) => {
    const chegou = y >= parada.marco - 1
    rota.marcos[i].cheio.classList.toggle('ativo', chegou)
    unidades[i].classList.toggle('chegou', chegou)
  })
}
