import type { ContextoCena } from '@/site/core/tipos'

/**
 * Cena da instalação (Incorporadoras). Sem pin: título por máscara com "no dia da instalação."
 * ganhando peso; o fio desce com a leitura (ponta a 60% da tela) e acende o nó de cada item; o nome
 * e o texto sobem linha a linha.
 */
export function cenaInstalacao(ctx: ContextoCena): void {
  const { gsap, root, util } = ctx
  const titulo = exigir(root, '.it-titulo')
  util.revelarTexto(titulo, { duracao: 1.2 })
  util.revelarTexto(exigir(root, '.it-lead'), { gatilho: titulo, atraso: 0.3 })
  const fio = exigir(root, '.it-fio')
  medirFio(ctx, fio)
  gsap.fromTo(
    exigir(root, '.it-fio-traco'),
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: { trigger: fio, start: 'top 60%', end: 'bottom 60%', scrub: 0.7 },
    },
  )
  for (const item of root.querySelectorAll('.it-item')) entrarItem(ctx, item)
}

function exigir(raiz: Element, seletor: string): HTMLElement {
  const el = raiz.querySelector(seletor)
  if (!(el instanceof HTMLElement)) throw new Error(`[cena instalacao] falta ${seletor}.`)
  return el
}

/**
 * O fio vai do nó do primeiro item ao do último; a posição é medida agora e a cada refresh. As
 * variáveis escritas fora do GSAP e o ouvinte saem no desmonte.
 */
function medirFio({ root, util, ScrollTrigger }: ContextoCena, fio: HTMLElement): void {
  const lista = exigir(root, '.it-lista')
  const nos = Array.from(root.querySelectorAll('.it-no'))
  const primeiro = nos[0]
  const ultimo = nos[nos.length - 1]
  if (!primeiro || !ultimo) throw new Error('[cena instalacao] falta .it-no.')
  const medir = () => {
    const base = lista.getBoundingClientRect().top
    const topo = primeiro.getBoundingClientRect().top - base + 5
    const fim = ultimo.getBoundingClientRect().top - base + 5
    fio.style.setProperty('--it-fio-topo', `${Math.round(topo)}px`)
    fio.style.setProperty('--it-fio', `${Math.round(fim - topo)}px`)
  }
  medir()
  ScrollTrigger.addEventListener('refreshInit', medir)
  util.registrarDesligamento(() => {
    ScrollTrigger.removeEventListener('refreshInit', medir)
    fio.style.removeProperty('--it-fio-topo')
    fio.style.removeProperty('--it-fio')
  })
}

/** O nó acende quando a ponta do fio passa; o nome e os textos sobem por máscara. */
function entrarItem({ gsap, util }: ContextoCena, item: Element): void {
  const no = exigir(item, '.it-no')
  gsap.fromTo(
    no,
    { scale: 0 },
    {
      scale: 1,
      duration: 0.6,
      ease: 'back.out(2.2)',
      scrollTrigger: { trigger: no, start: 'top 60%', toggleActions: 'play none none reverse' },
    },
  )
  const nome = exigir(item, '.it-nome')
  util.revelarTexto(nome, { inicio: 'top 85%', duracao: 1.1 })
  for (const [i, texto] of Array.from(item.querySelectorAll('.it-textos > p')).entries()) {
    if (texto instanceof HTMLElement) {
      util.revelarTexto(texto, { gatilho: nome, inicio: 'top 85%', atraso: 0.2 + i * 0.2 })
    }
  }
}
