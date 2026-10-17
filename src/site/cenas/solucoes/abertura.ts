import type { ContextoCena } from '@/site/core/tipos'

/**
 * Cena da abertura das Soluções. Quando a página fica pronta, a frase sobe linha a linha e "com uma
 * equipe só." ganha peso; o lead e o botão vêm em seguida. As quatro Unidades abrem em cascata,
 * cada faixa numa cortina da esquerda para a direita, com a foto assentando do zoom, e a etiqueta
 * da cidade sobe por último. O parallax interno acompanha a rolagem desde já.
 */
export function cenaAberturaDeSolucoes(ctx: ContextoCena): void {
  const { root, util } = ctx
  const cidades = abrirCidades(ctx)
  ctx.pronto
    .then(() => {
      // Depois do await o SplitText nasce fora do gsap.context da cena: ele mesmo devolve o
      // texto do React no desmonte.
      const splits = [
        util.revelarTexto(exigir(root, '.sl-titulo'), {
          gatilho: false,
          duracao: 1.2,
          stagger: 0.09,
        }),
        util.revelarTexto(exigir(root, '.sl-lead'), { gatilho: false, atraso: 0.45 }),
      ]
      util.registrarDesligamento(() => {
        for (const split of splits) split.revert()
      })
      subirAcoes(ctx)
      ctx.gsap.delayedCall(0.3, () => cidades.play())
    })
    .catch((erro: unknown) => ctx.reportar(erro, 'pronto'))
}

function exigir(raiz: Element, seletor: string): HTMLElement {
  const el = raiz.querySelector(seletor)
  if (!(el instanceof HTMLElement)) throw new Error(`[cena solucoes] falta ${seletor}.`)
  return el
}

/** As cortinas nascem fechadas na montagem e tocam depois do título, em cascata. */
function abrirCidades({ gsap, root, util }: ContextoCena): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true })
  root.querySelectorAll('.sl-cidade').forEach((cidade, i) => {
    const moldura = exigir(cidade, '.moldura')
    const img = exigir(moldura, 'img')
    const inicio = i * 0.14
    tl.fromTo(
      moldura,
      { clipPath: 'inset(0% 100% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut' },
      inicio,
    )
      .fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, inicio + 0.2)
      .fromTo(
        exigir(cidade, '.sl-cidade-nome'),
        { clipPath: 'inset(100% 0% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 0.8,
          ease: 'expo.out',
          clearProps: 'clipPath',
        },
        inicio + 0.85,
      )
    gsap.fromTo(
      img,
      { yPercent: -6 },
      {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: { trigger: moldura, start: 'top bottom', end: 'bottom top', scrub: 0.7 },
      },
    )
  })
  util.aoImprimir(() => tl.progress(1))
  return tl
}

/** O botão sobe por máscara, depois do lead. */
function subirAcoes({ gsap, root }: ContextoCena): void {
  gsap.fromTo(
    exigir(root, '.sl-acoes').children,
    { clipPath: 'inset(0% 0% 100% 0%)', y: 21 },
    {
      clipPath: 'inset(0% 0% 0% 0%)',
      y: 0,
      duration: 1,
      ease: 'expo.out',
      delay: 0.75,
      clearProps: 'clipPath,transform',
    },
  )
}
