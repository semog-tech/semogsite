import type { ContextoCena } from '@/site/core/tipos'

/**
 * Cena da abertura do Semog Garante. Quando a página fica pronta, "Semog Garante." sobe por máscara
 * e "Garante." ganha peso; o lead, a origem e as ações vêm em seguida. Logo depois o ano acende: as
 * doze casas sobem da base, uma por mês, e o traço marinho da arrecadação prevista corre o ano no
 * mesmo nível, de ponta reta. Os fatos entram em cascata quando chegam à tela; o 100% conta.
 */
export function cenaAberturaDoGarante(ctx: ContextoCena): void {
  const { root, util } = ctx
  const titulo = exigir(root, '.ga-titulo')
  const ano = percorrerAno(ctx)
  ctx.pronto
    .then(() => {
      // Depois do await o SplitText nasce fora do gsap.context da cena: ele mesmo devolve o
      // texto do React no desmonte.
      const splits = [
        util.revelarTexto(titulo, { gatilho: false, duracao: 1.2, stagger: 0.09 }),
        util.revelarTexto(exigir(root, '.ga-lead'), { gatilho: false, atraso: 0.45 }),
        util.revelarTexto(exigir(root, '.ga-origem'), { gatilho: false, atraso: 0.65 }),
      ]
      util.registrarDesligamento(() => {
        for (const split of splits) split.revert()
      })
      subirAcoes(ctx)
      ctx.gsap.delayedCall(0.6, () => ano.play())
    })
    .catch((erro: unknown) => ctx.reportar(erro, 'pronto'))
  entrarFatos(ctx)
}

function exigir(raiz: Element, seletor: string): HTMLElement {
  const el = raiz.querySelector(seletor)
  if (!(el instanceof HTMLElement)) throw new Error(`[cena semog-garante] falta ${seletor}.`)
  return el
}

/** Botão e link sobem juntos por máscara, depois do lead. */
function subirAcoes({ gsap, root }: ContextoCena): void {
  gsap.fromTo(
    exigir(root, '.ga-acoes').children,
    { clipPath: 'inset(0% 0% 100% 0%)', y: 21 },
    {
      clipPath: 'inset(0% 0% 0% 0%)',
      y: 0,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.1,
      delay: 0.85,
      clearProps: 'clipPath,transform',
    },
  )
}

/**
 * O ano nasce apagado e toca depois do título: o rótulo sobe, as casas crescem da base em cascata
 * (cada uma começa a ~30% da anterior), o traço da arrecadação prevista corre por cima delas e os
 * meses sobem com ele.
 */
function percorrerAno({ gsap, root, util }: ContextoCena): gsap.core.Timeline {
  const tl = gsap
    .timeline({ paused: true })
    .fromTo(
      exigir(root, '.ga-ano-rotulo .ga-in'),
      { yPercent: 110 },
      { yPercent: 0, duration: 1, ease: 'expo.out' },
      0,
    )
    .fromTo(
      root.querySelectorAll('.ga-regua-casas i'),
      { scaleY: 0 },
      { scaleY: 1, duration: 1.1, ease: 'expo.out', stagger: 0.07 },
      0.15,
    )
    .fromTo(
      exigir(root, '.ga-regua-previsto'),
      { clipPath: 'inset(0% 100% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'power2.inOut' },
      0.35,
    )
    .fromTo(
      root.querySelectorAll('.ga-meses li'),
      { yPercent: 100, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 0.9, ease: 'expo.out', stagger: 0.07 },
      0.45,
    )
  util.aoImprimir(() => tl.progress(1))
  return tl
}

/** Cada fato: rótulo e valor sobem juntos; o percentual grande conta a partir de zero. */
function entrarFatos({ gsap, root, util }: ContextoCena): void {
  util.entrarEmLote(root.querySelectorAll('.ga-fato'), {
    inicio: 'top 95%',
    cascata: 0.12,
    animar: (tl, item) => {
      tl.fromTo(
        item.querySelectorAll('.ga-in'),
        { yPercent: 110 },
        { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 },
        0.7,
      )
      const valor = item.querySelector('dd .ga-in')
      if (valor instanceof HTMLElement) {
        const contagem = contar(gsap, util, valor)
        if (contagem) tl.add(contagem, 0.7)
      }
    },
  })
}

/**
 * Tween de contagem para um percentual de dois dígitos ou mais ("100%"); o resto não conta (contar
 * até 1 seria só um tique). O HTML já traz o valor final, para quem lê sem JS; no fim (e no
 * desmonte), o texto volta a ser exatamente o original.
 */
function contar(
  gsap: ContextoCena['gsap'],
  util: ContextoCena['util'],
  el: HTMLElement,
): gsap.core.Tween | null {
  const final = el.textContent?.trim() ?? ''
  const achado = /^(\d+)%$/.exec(final)
  const para = achado ? Number(achado[1]) : 0
  if (para < 10) return null
  const estado = { valor: 0 }
  const escrever = (v: number) => {
    el.textContent = `${Math.round(v)}%`
  }
  // O texto escrito fora do GSAP volta ao original no desmonte (ou se a cena quebrar).
  util.registrarDesligamento(() => {
    el.textContent = final
  })
  return gsap.to(estado, {
    valor: para,
    duration: 1.6,
    ease: 'power3.out',
    onStart: () => escrever(0),
    onUpdate: () => escrever(estado.valor),
    onComplete: () => {
      el.textContent = final
    },
  })
}
