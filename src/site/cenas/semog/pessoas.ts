import type { ContextoCena } from '@/site/core/tipos'

/**
 * Cena das pessoas (A Semog). Sem pin: título por máscara com "Gente na relação." ganhando peso;
 * a moldura dos sócios abre de baixo como as fotos; as quatro cidades abrem em cascata, cada foto
 * assentando do zoom.
 */
export function cenaPessoas(ctx: ContextoCena): void {
  const { root, util } = ctx
  util.revelarTexto(exigir(root, '.ps-titulo'), { duracao: 1.2 })
  util.revelarTexto(exigir(root, '.ps-lead'), { gatilho: exigir(root, '.ps-titulo'), atraso: 0.3 })
  for (const item of Array.from(root.querySelectorAll('.ps-item'))) {
    const titulo = exigir(item, '.ps-item-titulo')
    util.revelarTexto(titulo, { inicio: 'top 85%' })
    util.revelarTexto(exigir(item, '.ps-item-texto'), {
      gatilho: titulo,
      inicio: 'top 85%',
      atraso: 0.15,
    })
  }
  abrirMolduraDosSocios(ctx)
  abrirCidades(ctx)
}

function exigir(raiz: Element, seletor: string): HTMLElement {
  const el = raiz.querySelector(seletor)
  if (!(el instanceof HTMLElement)) throw new Error(`[cena pessoas] falta ${seletor}.`)
  return el
}

/**
 * A mesma cortina das fotos; o rótulo (o selo, enquanto a foto não chega) e a legenda sobem quando
 * ela termina de abrir.
 */
function abrirMolduraDosSocios({ gsap, root, util }: ContextoCena): void {
  const quadro = exigir(root, '.ps-socios')
  const tl = gsap
    .timeline({ scrollTrigger: { trigger: quadro, start: 'top 82%', once: true } })
    .fromTo(
      exigir(quadro, '.moldura'),
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' },
    )
    .from(
      quadro.querySelectorAll('.ps-aenviar-rotulo > span, figcaption'),
      { yPercent: 60, autoAlpha: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08 },
      0.9,
    )
  util.aoImprimir(() => tl.progress(1))
}

/** Cada cidade: moldura abre de baixo e a foto assenta de 1,3; em cascata de 0,12 s. */
function abrirCidades({ root, util }: ContextoCena): void {
  util.entrarEmLote(root.querySelectorAll('.ps-cidade'), {
    inicio: 'top 85%',
    cascata: 0.12,
    animar: (tl, cidade) => {
      tl.fromTo(
        exigir(cidade, '.moldura'),
        { clipPath: 'inset(100% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' },
      )
        .from(exigir(cidade, 'img'), { scale: 1.3, duration: 1.8, ease: 'expo.out' }, 0.2)
        .from(
          exigir(cidade, 'figcaption'),
          { yPercent: 60, autoAlpha: 0, duration: 0.9, ease: 'expo.out' },
          0.9,
        )
    },
  })
}
