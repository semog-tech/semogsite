import type { ContextoCena } from '@/site/core/tipos'

/**
 * Cena dos pilares. Os três pilares são o símbolo III do logo. No desktop eles sobem do chão em
 * sequência quando o palco chega; com o palco fixado, cada face frontal vira uma coluna de
 * leitura, uma depois da outra. Abaixo de 1100px o texto vem empilhado e o III fecha a cena. Na
 * saída, a luz das faces desce em feixes e o marinho vira gelo.
 */
const DESKTOP = '(min-width: 1100px)'
/** Onde a descida já está clara o bastante para o cabeçalho passar ao tema gelo. */
const DESCIDA_CLARA = 0.4

export function cenaPilares(ctx: ContextoCena): void {
  const { gsap, root, util } = ctx
  const palco = root.querySelector('.pilares-palco')
  const descida = root.querySelector('.pilares-descida')
  const titulo = root.querySelector('.pilares-titulo')
  if (
    !(palco instanceof HTMLElement) ||
    !(descida instanceof HTMLElement) ||
    !(titulo instanceof HTMLElement)
  ) {
    throw new Error('[cena pilares] estrutura incompleta.')
  }
  // O texto é do React: a cena guarda os nós de antes e os devolve no desmonte (ou se quebrar),
  // senão uma montagem nova (StrictMode, volta à página) duplicaria o numeral.
  util.registrarDesligamento(enfatizarUltimaOracao(titulo))
  util.registrarDesligamento(prepararDestaques(root))
  util.revelarTexto(titulo, { duracao: 1.1 })

  const mm = gsap.matchMedia(root)
  mm.add(DESKTOP, () => montarDesktop(ctx, palco))
  mm.add(`not all and ${DESKTOP}`, () => montarEmpilhado(ctx))

  montarDescida(ctx, descida)
}

/* ---- Texto ---------------------------------------------------------------------- */

/** Devolve a função que repõe os filhos originais do elemento. */
function guardarFilhos(el: Element): () => void {
  const originais = Array.from(el.childNodes)
  return () => el.replaceChildren(...originais)
}

/** A última oração do título ("com uma equipe só.") ganha ênfase de peso. */
function enfatizarUltimaOracao(titulo: HTMLElement): () => void {
  const repor = guardarFilhos(titulo)
  const texto = titulo.textContent?.trim() ?? ''
  const corte = texto.lastIndexOf(', ')
  if (corte < 0) return repor
  const enfase = document.createElement('em')
  enfase.className = 'peso'
  enfase.textContent = texto.slice(corte + 2)
  titulo.replaceChildren(document.createTextNode(`${texto.slice(0, corte + 1)} `), enfase)
  return repor
}

/**
 * Destaques tirados do próprio texto (que vem do conteúdo tipado): no Semog Garante, o primeiro
 * percentual vira numeral grande; na Cobrança, a primeira frase vira frase-guia. Sem JS o
 * parágrafo inteiro continua lá. Devolve a função que desfaz os dois.
 */
function prepararDestaques(root: HTMLElement): () => void {
  const desfazer: Array<() => void> = []
  const garante = root.querySelector('[data-destaque="percentual"]')
  const percentual = garante?.textContent?.match(/\d+%/)?.[0]
  if (garante && percentual) {
    const numeral = document.createElement('span')
    numeral.className = 'pilar-numeral linha'
    numeral.setAttribute('aria-hidden', 'true')
    const interno = document.createElement('span')
    interno.className = 'linha-interna peso'
    interno.textContent = percentual
    numeral.append(interno)
    garante.before(numeral)
    desfazer.push(() => numeral.remove())
  }
  const cobranca = root.querySelector('[data-destaque="frase"]')
  const texto = cobranca?.textContent?.trim() ?? ''
  const fim = texto.indexOf('. ')
  if (cobranca && fim > 0) {
    const repor = guardarFilhos(cobranca)
    const frase = document.createElement('p')
    frase.className = 'pilar-frase'
    frase.textContent = texto.slice(0, fim + 1)
    cobranca.before(frase)
    cobranca.textContent = texto.slice(fim + 2)
    desfazer.push(() => {
      frase.remove()
      repor()
    })
  }
  return () => {
    for (const passo of desfazer) passo()
  }
}

/** Blocos de texto de uma face, na ordem de leitura. */
function blocosDaFace(pilar: Element): Element[] {
  return Array.from(pilar.querySelectorAll('.pilar-titulo, .pilar-frase, .pilar-texto'))
}

/* ---- Desktop -------------------------------------------------------------------- */

function montarDesktop(ctx: ContextoCena, palco: HTMLElement): void {
  const { gsap, ScrollTrigger, root, util } = ctx
  const pilares = gsap.utils.toArray<HTMLElement>('.pilares-fila .pilar', root)
  const subida = gsap
    .timeline({ scrollTrigger: { trigger: palco, start: 'top 70%', once: true } })
    .from('.pilares-fila .pilar-corpo', {
      yPercent: 112,
      duration: 1.3,
      ease: 'expo.out',
      stagger: 0.16,
    })

  // Um pin, uma ideia: as faces viram colunas de leitura, uma depois da outra.
  const leitura = util.pinScrub(root, { alvo: palco, distancia: '+=150%', scrub: 0.7 })
  pilares.forEach((pilar, i) => {
    lerFace(ctx, leitura, pilar, i * 0.7)
  })
  leitura.to({}, { duration: 0.35 })
  util.aoImprimir(() => {
    subida.progress(1)
    leitura.progress(1)
  })
  // Ao cruzar 1100px depois da carga, este pin nasce depois dos de baixo: reordena.
  ScrollTrigger.sort()
}

/**
 * Uma face: título, destaque e texto sobem por máscara linha a linha, a luz atravessa a face e o
 * numeral ganha peso.
 */
function lerFace(
  ctx: ContextoCena,
  leitura: gsap.core.Timeline,
  pilar: HTMLElement,
  inicio: number,
): void {
  blocosDaFace(pilar).forEach((bloco, j) => {
    linhasNoPin(ctx, leitura, bloco, inicio + j * 0.16)
  })
  // A luz atravessa a face de cima para baixo enquanto ela vira coluna de leitura.
  const brilho = pilar.querySelector('.pilar-brilho')
  if (brilho) {
    leitura.fromTo(
      brilho,
      { yPercent: 0 },
      { yPercent: 325, duration: 1.2, ease: 'power1.inOut' },
      inicio,
    )
  }
  const numeral = pilar.querySelector('.pilar-numeral .linha-interna')
  if (numeral) {
    leitura
      .from(numeral, { yPercent: 110, duration: 0.6, ease: 'expo.out' }, inicio + 0.12)
      .fromTo(
        numeral,
        { fontVariationSettings: '"wght" 250' },
        { fontVariationSettings: '"wght" 650', duration: 0.8, ease: 'power2.inOut' },
        inicio + 0.3,
      )
  }
}

/**
 * Máscara por linha dentro da timeline do pin. As linhas dependem da largura e da fonte: cada
 * re-divisão troca a sub-timeline no mesmo lugar e a sincroniza com a rolagem atual.
 */
function linhasNoPin(
  { gsap, SplitText }: ContextoCena,
  leitura: gsap.core.Timeline,
  bloco: Element,
  posicao: number,
): void {
  let parte: gsap.core.Timeline | null = null
  SplitText.create(bloco, {
    type: 'lines',
    mask: 'lines',
    autoSplit: true,
    linesClass: 'revela-linha',
    onSplit(self) {
      if (parte) {
        leitura.remove(parte)
        parte.kill()
      }
      parte = gsap.timeline().from(self.lines, {
        yPercent: 110,
        duration: 0.6,
        ease: 'expo.out',
        stagger: 0.05,
      })
      leitura.add(parte, posicao)
      parte.totalTime(gsap.utils.clamp(0, parte.totalDuration(), leitura.time() - posicao))
    },
  })
}

/* ---- Empilhado (abaixo de 1100px) ---------------------------------------------- */

function montarEmpilhado({ gsap, root, util }: ContextoCena): void {
  for (const pilar of Array.from(root.querySelectorAll('.pilares-fila .pilar'))) {
    for (const bloco of blocosDaFace(pilar)) {
      if (bloco instanceof HTMLElement) util.revelarTexto(bloco)
    }
    const numeral = pilar.querySelector('.pilar-numeral .linha-interna')
    if (numeral) {
      gsap
        .timeline({ scrollTrigger: { trigger: numeral, start: 'top 85%', once: true } })
        .from(numeral, { yPercent: 110, duration: 1, ease: 'expo.out' })
        .fromTo(
          numeral,
          { fontVariationSettings: '"wght" 250' },
          { fontVariationSettings: '"wght" 650', duration: 1.5, ease: 'power2.inOut' },
          0.45,
        )
    }
  }
  const subida = gsap
    .timeline({ scrollTrigger: { trigger: '.pilares-iii', start: 'top 80%', once: true } })
    .from('.pilares-iii .pilar-corpo', {
      yPercent: 112,
      duration: 1.3,
      ease: 'expo.out',
      stagger: 0.16,
    })
  util.aoImprimir(() => subida.progress(1))
}

/* ---- Descida -------------------------------------------------------------------- */

/**
 * Os feixes continuam as faces para baixo enquanto o fundo vai do marinho ao gelo, e uma faixa
 * de luz desce por eles com a rolagem. Quando a parte clara passa sob o cabeçalho, a seção
 * assume o tema gelo (o cabeçalho copia o tema da seção).
 */
function montarDescida({ gsap, ScrollTrigger, root, util }: ContextoCena, descida: HTMLElement) {
  // A faixa de luz desce pelos feixes, um depois do outro, na ordem de leitura.
  gsap.fromTo(
    '.feixe-luz',
    { yPercent: 0 },
    {
      yPercent: 500,
      ease: 'none',
      stagger: 0.12,
      scrollTrigger: { trigger: descida, start: 'top bottom', end: 'bottom bottom', scrub: 0.7 },
    },
  )
  const temaOriginal = root.dataset.tema ?? 'marinho'
  ScrollTrigger.create({
    trigger: descida,
    start: () =>
      `top+=${Math.round(descida.offsetHeight * DESCIDA_CLARA)} top+=${alturaCabecalho()}`,
    end: 'max',
    onToggle: (self) => {
      root.dataset.tema = self.isActive ? 'gelo' : temaOriginal
    },
  })
  // Impressa, a seção é marinho inteira: com o tema gelo preso (rolou além da descida), o texto
  // saía marinho sobre marinho.
  util.aoImprimir(() => {
    root.dataset.tema = temaOriginal
  })
}

/** Altura do cabeçalho em px, lida do token --cab. */
function alturaCabecalho(): number {
  const valor = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--cab'),
  )
  return Number.isFinite(valor) ? valor : 0
}
