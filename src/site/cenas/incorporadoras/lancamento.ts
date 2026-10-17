import type { ContextoCena } from '@/site/core/tipos'

/**
 * Cena do lançamento (Incorporadoras). Sem pin: a pergunta sobe por máscara e "no radar?" ganha
 * peso; a frase vem linha a linha e o botão sobe em seguida. Na saída, a coluna lavanda cresce com a
 * rolagem até encostar no convite da proposta. O "Construtora" do pedido vem marcado pela página
 * (`perfilInicial`), não por esta cena.
 */
export function cenaLancamento(ctx: ContextoCena): void {
  const { gsap, root, util } = ctx
  const titulo = exigir(root, '.ln-titulo')
  util.revelarTexto(titulo, { duracao: 1.3, stagger: 0.11 })
  util.revelarTexto(exigir(root, '.ln-texto'), { gatilho: titulo, atraso: 0.35 })
  const subir = gsap.fromTo(
    [exigir(root, '.ln-acoes')],
    { clipPath: 'inset(0% 0% 100% 0%)', y: 21 },
    {
      clipPath: 'inset(0% 0% 0% 0%)',
      y: 0,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.12,
      delay: 0.7,
      clearProps: 'clipPath,transform',
      scrollTrigger: { trigger: titulo, start: 'top 80%', toggleActions: 'play none none none' },
    },
  )
  util.aoImprimir(() => subir.progress(1))
  sair(ctx)
}

function exigir(raiz: Element, seletor: string): HTMLElement {
  const el = raiz.querySelector(seletor)
  if (!(el instanceof HTMLElement)) throw new Error(`[cena lancamento] falta ${seletor}.`)
  return el
}

/** A coluna lavanda cresce do pé da cena até encostar no convite da proposta. */
function sair({ gsap, root }: ContextoCena): void {
  gsap.fromTo(
    exigir(root, '.ln-veu'),
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: exigir(root, '.ln-saida'),
        start: 'top bottom',
        end: 'bottom bottom',
        scrub: 0.7,
      },
    },
  )
}
