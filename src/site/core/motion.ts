import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'

/* Lenis dirigido pelo ticker do GSAP (README do Lenis 1.3): ScrollTrigger atualizado a cada
   rolagem e lagSmoothing desligado. O ticker do GSAP é o ÚNICO requestAnimationFrame da página.
   O movimento não consulta a preferência de movimento reduzido do sistema: decisão do Leandro.
   O Next avalia este arquivo no servidor: aqui nada toca o DOM fora do `if` abaixo. Os módulos
   `patamares.ts` e `util.ts` registram plugins do GSAP no topo; é idempotente e não usa DOM. */
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)
  // Celular: a barra de endereço que some e volta muda a altura da janela; sem isto cada vez
  // seria um refresh e os pins saltariam. O layout usa svh. Spec 3.2: `ignoreMobileResize` +
  // `svh` é a solução; `normalizeScroll` e `syncTouch` do Lenis foram medidos no protótipo e
  // descartados (o primeiro encurta todo flick rápido; o segundo vira scroll-jacking).
  ScrollTrigger.config({ ignoreMobileResize: true })
}

export { gsap, ScrollTrigger, SplitText }

/** Cria o Lenis e o liga ao GSAP. Se falhar, a página segue com rolagem nativa. */
export function criarLenis(reportar: (erro: unknown) => void): {
  lenis: Lenis | null
  desligar: () => void
} {
  try {
    // allowNestedScroll: uma caixa com rolagem própria (menu aberto) segura o gesto enquanto
    // ainda tem para onde rolar. respectReducedMotion: false, pela decisão acima.
    const lenis = new Lenis({
      autoRaf: false,
      anchors: true,
      allowNestedScroll: true,
      respectReducedMotion: false,
    })
    const desligarRolagem = lenis.on('scroll', ScrollTrigger.update)
    const tique = (tempo: number) => lenis.raf(tempo * 1000)
    gsap.ticker.add(tique)
    gsap.ticker.lagSmoothing(0)
    return {
      lenis,
      desligar: () => {
        gsap.ticker.remove(tique)
        desligarRolagem()
        lenis.destroy()
      },
    }
  } catch (erro) {
    reportar(erro)
    return { lenis: null, desligar: () => {} }
  }
}

const ESPERA_MAXIMA_MS = 5000

/** Fontes e load, nunca mais que 5 s e sem nunca rejeitar: o pior caso é não esperar. */
async function esperarCarregamento(aoAgendarTeto: (id: number) => void): Promise<void> {
  const load =
    document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise<void>((resolver) =>
          window.addEventListener('load', () => resolver(), { once: true }),
        )
  const fontes = document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve()
  const teto = new Promise<void>((resolver) => {
    aoAgendarTeto(window.setTimeout(resolver, ESPERA_MAXIMA_MS))
  })
  try {
    await Promise.race([Promise.all([load, fontes]), teto])
  } catch (erro) {
    console.error('[motion] Falha esperando fontes/carregamento.', erro)
  }
}

/**
 * Marca `html.motion` depois que fontes e assets chegaram e recalcula os gatilhos. Estado
 * inicial escondido fica no CSS sob `html.js:not(.motion)`. `cancelar` (desmonte) impede a marca.
 */
export function marcarMotionQuandoPronto(): { pronto: Promise<void>; cancelar: () => void } {
  let cancelado = false
  let teto = 0
  const pronto = (async () => {
    await esperarCarregamento((id) => {
      teto = id
    })
    if (cancelado) return
    document.documentElement.classList.add('motion')
    ScrollTrigger.refresh()
  })()
  return {
    pronto,
    cancelar: () => {
      cancelado = true
      window.clearTimeout(teto)
    },
  }
}

const ESPERA_RECALCULO_MS = 180

/**
 * Recalcula os ScrollTriggers quando a altura do <main> muda (cena que cresce, imagem que
 * chega, fonte que troca a quebra), uma vez por rajada.
 */
export function vigiarAltura(): () => void {
  const main = document.querySelector('main')
  if (!(main instanceof HTMLElement) || typeof ResizeObserver === 'undefined') {
    throw new Error('[motion] Sem <main> ou ResizeObserver; a altura não é vigiada.')
  }
  const midiaImpressao = window.matchMedia('print')
  let ativo = true
  let referencia = main.offsetHeight
  let espera = 0
  const medir = () => {
    referencia = main.offsetHeight
  }
  ScrollTrigger.addEventListener('refresh', medir)
  const agendar = () => {
    if (!ativo) return
    window.clearTimeout(espera)
    espera = window.setTimeout(() => {
      if (midiaImpressao.matches || main.offsetHeight === referencia) return
      ScrollTrigger.refresh()
    }, ESPERA_RECALCULO_MS)
  }
  const observador = new ResizeObserver(agendar)
  observador.observe(main)
  const pendentes = Array.from(document.images).filter((img) => !img.complete)
  for (const img of pendentes) img.addEventListener('load', agendar, { once: true })
  document.fonts?.ready.then(agendar, (erro: unknown) =>
    console.error('[motion] fonts.ready falhou.', erro),
  )
  return () => {
    ativo = false
    observador.disconnect()
    window.clearTimeout(espera)
    ScrollTrigger.removeEventListener('refresh', medir)
    for (const img of pendentes) img.removeEventListener('load', agendar)
  }
}
