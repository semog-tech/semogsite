import type { ContextoCena } from '@/site/core/tipos'

/*
 * Cenas das seções das Soluções, sem pin: o título sobe por máscara quando chega à tela e os blocos
 * de cada seção entram em cascata, cada um abrindo de baixo. O Garante tem a sua (garante.ts).
 */

function exigir(raiz: Element, seletor: string): HTMLElement {
  const el = raiz.querySelector(seletor)
  if (!(el instanceof HTMLElement)) throw new Error(`[cena solucoes] falta ${seletor}.`)
  return el
}

/** Cada bloco abre de baixo, por máscara, quando chega à tela. */
function subirEmLote({ util }: ContextoCena, alvos: NodeListOf<Element>): void {
  util.entrarEmLote(alvos, {
    inicio: 'top 88%',
    cascata: 0.09,
    animar: (tl, item) => {
      tl.fromTo(
        item,
        { clipPath: 'inset(0% 0% 100% 0%)', y: 21 },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          y: 0,
          duration: 1,
          ease: 'expo.out',
          clearProps: 'clipPath,transform',
        },
        0,
      )
    },
  })
}

/** Título por máscara e blocos em lote: o desenho comum das seções. */
function secaoSimples(ctx: ContextoCena, titulo: string, blocos: string): void {
  ctx.util.revelarTexto(exigir(ctx.root, titulo), { duracao: 1.1 })
  subirEmLote(ctx, ctx.root.querySelectorAll(blocos))
}

/** Os três tipos: o traço de cada coluna corre da esquerda e o texto sobe atrás dele. */
export function cenaTiposDeSolucoes({ root, util }: ContextoCena): void {
  util.entrarEmLote(root.querySelectorAll('.sl-tipo'), {
    inicio: 'top 85%',
    cascata: 0.14,
    animar: (tl, tipo) => {
      tl.fromTo(
        tipo,
        { '--sl-traco': 0 },
        { '--sl-traco': 1, duration: 0.9, ease: 'expo.inOut' },
        0,
      )
      tl.fromTo(
        tipo.children,
        { clipPath: 'inset(0% 0% 100% 0%)', y: 21 },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          y: 0,
          duration: 1,
          ease: 'expo.out',
          stagger: 0.07,
          clearProps: 'clipPath,transform',
        },
        0.25,
      )
    },
  })
}

export function cenaPorqueDeSolucoes(ctx: ContextoCena): void {
  secaoSimples(ctx, '.sl-porque-titulo', '.sl-fato')
}

/** Prestação e software: o mesmo bloco, os itens brancos entram em cascata. */
export function cenaBlocoDeSolucao(ctx: ContextoCena): void {
  secaoSimples(ctx, '.sl-bloco-titulo', '.sl-lista li')
}

export function cenaAplicativoDeSolucoes(ctx: ContextoCena): void {
  secaoSimples(ctx, '.sl-ap-titulo', '.sl-ap-funcao, .sl-clube')
}

export function cenaPerguntasDeSolucoes(ctx: ContextoCena): void {
  secaoSimples(ctx, '.sl-perguntas-titulo', 'details')
}
