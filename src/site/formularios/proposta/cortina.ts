import { gsap } from 'gsap'

/**
 * Cortina reta do protótipo (`core/formulario-proposta.js`): a borda que apaga a etapa que sai é a
 * mesma que revela a que entra; avançar varre da direita para a esquerda. Aqui só o recorte e o
 * `data-transicao` (as duas etapas visíveis durante a troca); `inert` fica com o React.
 */
export function trocarEtapa(
  form: HTMLFormElement,
  de: HTMLElement,
  para: HTMLElement,
  avancar: boolean,
) {
  const fechada = avancar ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 0% 100%)'
  const entrando = avancar ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)'
  form.setAttribute('data-transicao', '')
  return gsap
    .timeline({
      defaults: { duration: 1.2, ease: 'expo.inOut' },
      onComplete: () => {
        form.removeAttribute('data-transicao')
        gsap.set([de, para], { clearProps: 'clipPath' })
      },
    })
    .fromTo(de, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: fechada }, 0)
    .fromTo(para, { clipPath: entrando }, { clipPath: 'inset(0% 0% 0% 0%)' }, 0)
    .from(
      para.children,
      { x: avancar ? 34 : -34, duration: 1.1, ease: 'expo.out', stagger: 0.05 },
      0.35,
    )
}
