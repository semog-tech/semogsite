import type { ContextoCena } from '@/site/core/tipos'

/**
 * Cena do Garante nas Soluções (a troca para o marinho). O nome sobe por máscara; o 100% e o 1%
 * sobem da base quando chegam à tela. A fila acompanha a rolagem, como nos papéis do Garante: o
 * traço céu corre de um ganho ao outro (no celular, de cima para baixo), cada nó acende quando o
 * traço chega a ele, e o texto de cada ganho sobe uma vez.
 */
export function cenaGaranteDeSolucoes(ctx: ContextoCena): void {
  const { gsap, root, util } = ctx
  util.revelarTexto(exigir(root, '.sl-ga-titulo'), { duracao: 1.2 })
  const numeros = gsap.fromTo(
    root.querySelectorAll('.sl-ga-in'),
    { yPercent: 110 },
    {
      yPercent: 0,
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.15,
      scrollTrigger: { trigger: exigir(root, '.sl-ga-fatos'), start: 'top 85%', once: true },
    },
  )
  util.aoImprimir(() => numeros.progress(1))
  correrFila(ctx)
  util.entrarEmLote(root.querySelectorAll('.sl-ga-item'), {
    inicio: 'top 85%',
    cascata: 0.12,
    animar: (tl, item) => {
      tl.fromTo(
        item.querySelectorAll('h3, p'),
        { clipPath: 'inset(0% 0% 100% 0%)', y: 21 },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          y: 0,
          duration: 1.1,
          ease: 'expo.out',
          stagger: 0.1,
          clearProps: 'clipPath,transform',
        },
        0,
      )
    },
  })
}

function exigir(raiz: Element, seletor: string): HTMLElement {
  const el = raiz.querySelector(seletor)
  if (!(el instanceof HTMLElement)) throw new Error(`[cena garante-solucoes] falta ${seletor}.`)
  return el
}

/** O traço e os nós presos à rolagem, entre a fila entrar a 85% da tela e chegar a 40%. */
function correrFila({ gsap, root }: ContextoCena): void {
  const fila = exigir(root, '.sl-ga-fila')
  const nos = Array.from(root.querySelectorAll('.sl-ga-no'))
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: fila, start: 'top 85%', end: 'top 40%', scrub: 0.7 },
  })
  tl.fromTo(fila, { '--sl-progresso': 0 }, { '--sl-progresso': 1, duration: 1 }, 0)
  nos.forEach((no, i) => {
    tl.fromTo(
      no,
      { scale: 0 },
      { scale: 1, duration: 0.08, ease: 'back.out(2.2)' },
      Math.max(0, i / Math.max(1, nos.length - 1) - 0.04),
    )
  })
}
