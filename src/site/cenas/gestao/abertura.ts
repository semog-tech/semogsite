import type { ContextoCena } from '@/site/core/tipos'

/**
 * Cena da abertura da Gestão. Quando a página fica pronta, o H1 sobe por máscara e "por inteiro."
 * ganha peso; o lead, as ações e o prazo vêm em seguida. Ao mesmo tempo a coluna do contrato abre
 * de baixo e as sete frentes sobem em cascata, cada uma com o nó que assenta antes do nome. Os
 * números entram quando chegam à tela: o traço marinho corre por cima deles e os dois que são
 * contagem contam.
 */
export function cenaAberturaDaGestao(ctx: ContextoCena): void {
  const { root, util } = ctx
  const titulo = exigir(root, '.gab-titulo')
  const contrato = abrirContrato(ctx)
  ctx.pronto
    .then(() => {
      // Depois do await o SplitText nasce fora do gsap.context da cena: ele mesmo devolve o
      // texto do React no desmonte.
      const splits = [
        util.revelarTexto(titulo, { gatilho: false, duracao: 1.2, stagger: 0.09 }),
        util.revelarTexto(exigir(root, '.gab-lead'), { gatilho: false, atraso: 0.45 }),
      ]
      util.registrarDesligamento(() => {
        for (const split of splits) split.revert()
      })
      subir(ctx, exigir(root, '.gab-acoes').children, 0.75)
      subir(ctx, [exigir(root, '.gab-prazo')], 0.95)
      ctx.gsap.delayedCall(0.3, () => contrato.play())
    })
    .catch((erro: unknown) => ctx.reportar(erro, 'pronto'))
  entrarNumeros(ctx)
}

function exigir(raiz: Element, seletor: string): HTMLElement {
  const el = raiz.querySelector(seletor)
  if (!(el instanceof HTMLElement)) {
    throw new Error(`[cena administracao-de-condominios] falta ${seletor}.`)
  }
  return el
}

/** Sobe por máscara (recorte de baixo) com um passo curto de y. */
function subir({ gsap }: ContextoCena, alvos: ArrayLike<Element>, atraso: number): void {
  gsap.fromTo(
    alvos,
    { clipPath: 'inset(0% 0% 100% 0%)', y: 21 },
    {
      clipPath: 'inset(0% 0% 0% 0%)',
      y: 0,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.1,
      delay: atraso,
      clearProps: 'clipPath,transform',
    },
  )
}

/**
 * A coluna gelo abre de baixo para cima; o título dela e as frentes sobem em cascata, cada uma
 * ~30% depois da anterior, e o nó de cada frente cresce do centro um pouco antes do nome.
 */
function abrirContrato({ gsap, root, util }: ContextoCena): gsap.core.Timeline {
  const tl = gsap
    .timeline({ paused: true })
    .fromTo(
      exigir(root, '.gab-direita'),
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut', clearProps: 'clipPath' },
      0,
    )
    .fromTo(
      exigir(root, '.gab-contrato-titulo .gab-in'),
      { yPercent: 110 },
      { yPercent: 0, duration: 1.1, ease: 'expo.out' },
      0.55,
    )
    .fromTo(
      root.querySelectorAll('.gab-frente i'),
      { scale: 0 },
      { scale: 1, duration: 0.6, ease: 'back.out(2)', stagger: 0.08 },
      0.7,
    )
    .fromTo(
      root.querySelectorAll('.gab-frente .gab-in'),
      { yPercent: 110 },
      { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 },
      0.75,
    )
  util.aoImprimir(() => tl.progress(1))
  return tl
}

/** O traço corre, os rótulos e os valores sobem, e as contagens contam. */
function entrarNumeros({ gsap, root, util }: ContextoCena): void {
  const numeros = exigir(root, '.gab-numeros')
  const tl = gsap
    .timeline({
      scrollTrigger: { trigger: numeros, start: 'top 96%', toggleActions: 'play none none none' },
      delay: 0.5,
    })
    .fromTo(
      exigir(root, '.gab-traco'),
      { scaleX: 0 },
      { scaleX: 1, duration: 1.3, ease: 'expo.inOut' },
      0,
    )
    .fromTo(
      numeros.querySelectorAll('.gab-in'),
      { yPercent: 110 },
      { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.06 },
      0.35,
    )
  for (const el of numeros.querySelectorAll('[data-contar]')) {
    if (el instanceof HTMLElement) tl.add(contar(gsap, util, el), 0.45)
  }
  util.aoImprimir(() => tl.progress(1))
}

/**
 * Contagem de 0 ao valor do HTML (com o prefixo, se houver). O HTML já traz o valor final, para
 * quem lê sem JS; no fim (e no desmonte), o texto volta a ser exatamente o original.
 */
function contar(
  gsap: ContextoCena['gsap'],
  util: ContextoCena['util'],
  el: HTMLElement,
): gsap.core.Tween {
  const final = el.textContent?.trim() ?? ''
  const para = Number(el.dataset.contar)
  if (!Number.isFinite(para)) {
    throw new Error(`[cena administracao-de-condominios] contagem inválida: ${final}.`)
  }
  const prefixo = el.dataset.prefixo ?? ''
  const estado = { valor: 0 }
  const escrever = (v: number) => {
    el.textContent = `${prefixo}${Math.round(v)}`
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
