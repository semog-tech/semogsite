import type { ContextoCena } from '@/site/core/tipos'

/**
 * Cena do manifesto (A Semog). A frase da casa sobe linha a linha por máscara assim que a página
 * fica pronta, e "Esse trabalho é nosso." ganha peso na mesma timeline. O cabeçalho acompanha a
 * passagem do marinho para a luz. Os cinco números entram em cascata quando chegam à tela: o
 * rótulo sobe, o número sobe e conta.
 */
export function cenaManifesto(ctx: ContextoCena): void {
  const { root, util } = ctx
  const titulo = root.querySelector('.mf-titulo')
  if (!(titulo instanceof HTMLElement)) throw new Error('[cena a-semog] falta .mf-titulo.')
  ctx.pronto
    .then(() => {
      // Depois do await o SplitText nasce fora do gsap.context da cena: ele mesmo devolve o
      // texto do React no desmonte.
      const split = util.revelarTexto(titulo, { gatilho: false, duracao: 1.2, stagger: 0.09 })
      util.registrarDesligamento(() => split.revert())
    })
    .catch((erro: unknown) => ctx.reportar(erro, 'pronto'))
  entrarNumeros(ctx)
  seguirTema(ctx)
}

/**
 * O cabeçalho lê o tema da seção: marinho enquanto o trecho escuro está sob ele, claro quando a
 * luz (a partir de 62% da seção) chega à linha do cabeçalho.
 */
function seguirTema({ root, ScrollTrigger, util }: ContextoCena): void {
  ScrollTrigger.create({
    trigger: root,
    start: '62% top+=68',
    onToggle: (self) => {
      root.dataset.tema = self.isActive ? 'claro' : 'marinho'
    },
  })
  util.aoImprimir(() => {
    root.dataset.tema = 'marinho'
  })
}

/** Cada número: rótulo e valor sobem juntos; o valor conta a partir de zero. */
function entrarNumeros({ gsap, root, util }: ContextoCena): void {
  util.entrarEmLote(root.querySelectorAll('.mf-numero'), {
    inicio: 'top 92%',
    cascata: 0.1,
    animar: (tl, item) => {
      tl.fromTo(
        item.querySelectorAll('.mf-in'),
        { yPercent: 110 },
        { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 },
        0.35,
      )
      const valor = item.querySelector('[data-conta]')
      if (valor instanceof HTMLElement) tl.add(contar(gsap, util, valor), 0.35)
    },
  })
}

/** Tween de contagem na timeline do item (o HTML já traz o valor final, para quem lê sem JS). */
function contar(
  gsap: ContextoCena['gsap'],
  util: ContextoCena['util'],
  el: HTMLElement,
): gsap.core.Tween {
  const para = Number(el.dataset.conta)
  if (!Number.isFinite(para)) {
    throw new Error(`[cena a-semog] data-conta inválido: ${el.dataset.conta}`)
  }
  const { prefixo = '', sufixo = '' } = el.dataset
  const estado = { valor: 0 }
  const escrever = (v: number) => {
    el.textContent = `${prefixo}${Math.round(v).toLocaleString('pt-BR')}${sufixo}`
  }
  // O texto escrito fora do GSAP volta ao valor final no desmonte (ou se a cena quebrar).
  util.registrarDesligamento(() => escrever(para))
  return gsap.to(estado, {
    valor: para,
    duration: 1.6,
    ease: 'power3.out',
    onStart: () => escrever(0),
    onUpdate: () => escrever(estado.valor),
    onComplete: () => escrever(para),
  })
}
