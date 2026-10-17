import type { ContextoCena } from '@/site/core/tipos'

/**
 * Cena da proposta "Metades", o fechamento que volta à abertura. O véu lavanda da metade menor já
 * chega pronto. "Seja Semog." sobe por máscara e "Semog." ganha peso; a etapa 1 do pedido entra
 * em cascata: o rótulo sobe e a linha de cada campo se desenha da esquerda para a direita. As
 * etapas e a validação são do formulário (src/site/formularios/proposta).
 */
export function cenaProposta(ctx: ContextoCena): void {
  const { gsap, root, util, estreito } = ctx
  const tl = convite(ctx)
  const form = root.querySelector('.proposta-form')
  if (!(form instanceof HTMLElement)) throw new Error('[cena proposta] falta .proposta-form.')
  // No desktop o formulário está à vista junto com o título: entra na mesma timeline,
  // começando a ~30% do fim da subida do título. No celular, quando ele chega à tela.
  const tlForm = estreito()
    ? gsap.timeline({ scrollTrigger: { trigger: form, start: 'top 85%', once: true } })
    : tl
  entradaFormulario(form, tlForm, estreito() ? 0 : 0.6)
  util.aoImprimir(() => {
    tl.progress(1)
    tlForm.progress(1)
  })
}

function convite({ gsap, SplitText, root }: ContextoCena): gsap.core.Timeline {
  const tl = gsap.timeline({ scrollTrigger: { trigger: root, start: 'top 92%', once: true } })
  tl.fromTo(
    root.querySelectorAll('.proposta-titulo .linha-interna'),
    { yPercent: 110 },
    { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.11 },
    0,
  ).fromTo(
    root.querySelectorAll('.proposta-titulo .peso'),
    { fontVariationSettings: '"wght" 250' },
    { fontVariationSettings: '"wght" 650', duration: 1.5, ease: 'power2.inOut' },
    0.75,
  )
  const chamada = root.querySelector('.proposta-chamada')
  if (chamada instanceof HTMLElement) {
    const split = SplitText.create(chamada, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'revela-linha',
    })
    tl.fromTo(
      split.lines,
      { yPercent: 110 },
      { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.08 },
      0.45,
    )
    // Desfeita ao fim, a chamada volta a quebrar sozinha se a largura mudar.
    tl.call(() => split.revert(), undefined, 2.3)
  }
  return tl
}

/**
 * Cascata da etapa 1. Todo estado inicial nasce com o fromTo, na montagem: nada aparece inteiro
 * antes da vez. Ao fim, clip-path e transform saem: cortariam foco e erro.
 */
function entradaFormulario(form: HTMLElement, tl: gsap.core.Timeline, em: number): void {
  const itens = Array.from(form.querySelectorAll('.entrada'))
  itens.forEach((item, i) => {
    const t = em + i * 0.12
    const controle = item.querySelector('.fp-controle')
    const rotulo = item.querySelector('label')
    if (controle && rotulo) {
      subir(tl, rotulo, t)
      tl.fromTo(
        controle,
        { clipPath: 'inset(0% 100% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.2,
          ease: 'expo.inOut',
          clearProps: 'clipPath',
        },
        t + 0.1,
      )
    } else {
      subir(tl, item, t)
    }
  })
}

/** Máscara de baixo para cima, 21px de subida. */
function subir(tl: gsap.core.Timeline, alvo: Element, em: number): void {
  tl.fromTo(
    alvo,
    { clipPath: 'inset(0% 0% 100% 0%)', y: 21 },
    {
      clipPath: 'inset(0% 0% 0% 0%)',
      y: 0,
      duration: 1,
      ease: 'expo.out',
      clearProps: 'clipPath,transform',
    },
    em,
  )
}
