import type { ContextoCena } from '@/site/core/tipos'

/**
 * Cena da abertura de Incorporadoras. Quando a página fica pronta, a promessa sobe linha a linha e
 * "bem antes das chaves." ganha peso; a moldura da obra abre de baixo ~30% depois, com a foto
 * assentando do zoom; o lead e as ações vêm em seguida. Os quatro números entram em cascata quando
 * chegam à tela e contam.
 */
export function cenaAberturaDasIncorporadoras(ctx: ContextoCena): void {
  const { root, util } = ctx
  const titulo = exigir(root, '.ab-titulo')
  const foto = abrirFoto(ctx)
  ctx.pronto
    .then(() => {
      // Depois do await o SplitText nasce fora do gsap.context da cena: ele mesmo devolve o
      // texto do React no desmonte.
      const splits = [
        util.revelarTexto(titulo, { gatilho: false, duracao: 1.2, stagger: 0.09 }),
        util.revelarTexto(exigir(root, '.ab-lead'), { gatilho: false, atraso: 0.45 }),
      ]
      util.registrarDesligamento(() => {
        for (const split of splits) split.revert()
      })
      ctx.gsap.delayedCall(0.35, () => foto.play())
      subirAcoes(ctx)
    })
    .catch((erro: unknown) => ctx.reportar(erro, 'pronto'))
  entrarNumeros(ctx)
}

function exigir(raiz: Element, seletor: string): HTMLElement {
  const el = raiz.querySelector(seletor)
  if (!(el instanceof HTMLElement)) throw new Error(`[cena incorporadoras] falta ${seletor}.`)
  return el
}

/**
 * A cortina da moldura nasce fechada na montagem e toca depois do título; o parallax interno
 * acompanha a rolagem desde já. A obra não tem legenda (resposta do Leandro).
 */
function abrirFoto({ gsap, root, util }: ContextoCena): gsap.core.Timeline {
  const moldura = exigir(root, '.ab-foto .moldura')
  const img = exigir(moldura, 'img')
  const tl = gsap
    .timeline({ paused: true })
    .fromTo(
      moldura,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' },
    )
    .fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0.2)
  gsap.fromTo(
    img,
    { yPercent: -5 },
    {
      yPercent: 5,
      ease: 'none',
      scrollTrigger: { trigger: moldura, start: 'top bottom', end: 'bottom top', scrub: 0.7 },
    },
  )
  util.aoImprimir(() => tl.progress(1))
  return tl
}

/** Botão e link sobem juntos por máscara, depois do lead. */
function subirAcoes({ gsap, root }: ContextoCena): void {
  gsap.fromTo(
    exigir(root, '.ab-acoes').children,
    { clipPath: 'inset(0% 0% 100% 0%)', y: 21 },
    {
      clipPath: 'inset(0% 0% 0% 0%)',
      y: 0,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.1,
      delay: 0.75,
      clearProps: 'clipPath,transform',
    },
  )
}

/** Cada número: rótulo e valor sobem juntos; o valor conta a partir de zero. */
function entrarNumeros({ gsap, root, util }: ContextoCena): void {
  util.entrarEmLote(root.querySelectorAll('.ab-numero'), {
    inicio: 'top 95%',
    cascata: 0.1,
    animar: (tl, item) => {
      tl.fromTo(
        item.querySelectorAll('.ab-in'),
        { yPercent: 110 },
        { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 },
        0.6,
      )
      const valor = item.querySelector('[data-conta]')
      if (valor instanceof HTMLElement) tl.add(contar(gsap, util, valor), 0.6)
    },
  })
}

/**
 * Tween de contagem na timeline do item. O HTML já traz o valor final, para quem lê sem JS; no
 * desmonte, o texto volta a ser exatamente o original.
 */
function contar(
  gsap: ContextoCena['gsap'],
  util: ContextoCena['util'],
  el: HTMLElement,
): gsap.core.Tween {
  const para = Number(el.dataset.conta)
  if (!Number.isFinite(para)) {
    throw new Error(`[cena incorporadoras] data-conta inválido: ${el.dataset.conta}`)
  }
  const prefixo = el.dataset.prefixo ?? ''
  const original = el.textContent ?? ''
  const estado = { valor: 0 }
  const escrever = (v: number) => {
    el.textContent = `${prefixo}${Math.round(v).toLocaleString('pt-BR')}`
  }
  // O texto escrito fora do GSAP volta ao original no desmonte (ou se a cena quebrar).
  util.registrarDesligamento(() => {
    el.textContent = original
  })
  return gsap.to(estado, {
    valor: para,
    duration: 1.6,
    ease: 'power3.out',
    onStart: () => escrever(0),
    onUpdate: () => escrever(estado.valor),
    onComplete: () => escrever(para),
  })
}
