import type { Reportar } from '@/site/core/ganchos'

/*
 * O JS do pacote landing (porta de landing.js do protótipo, sem o menu, que o cabeçalho liga, e
 * sem os formulários demonstrativos): entradas por máscara abaixo da dobra, a linha do cabeçalho
 * depois do primeiro respiro, os links "#proposta" focando o primeiro campo da etapa ativa, e as
 * marcas `js` e `motion`. Cada parte que não liga vai ao Sentry e as outras seguem. Nada aqui
 * roda no topo do módulo: o Next avalia este arquivo no servidor.
 */

const ROLAGEM_PARA_LINHA = 8

/** Sem IntersectionObserver, nada fica escondido: o CSS só esconde com html.landing-viva. */
function revelarAoEntrar(): () => void {
  const blocos = Array.from(document.querySelectorAll('.revelar'))
  if (blocos.length === 0 || typeof IntersectionObserver === 'undefined') return () => undefined
  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue
        entrada.target.classList.add('visivel')
        observador.unobserve(entrada.target)
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  )
  for (const bloco of blocos) observador.observe(bloco)
  document.documentElement.classList.add('landing-viva')
  return () => {
    observador.disconnect()
    document.documentElement.classList.remove('landing-viva')
  }
}

function linhaDoCabecalho(): () => void {
  const cabecalho = document.querySelector('[data-cabecalho]')
  if (!(cabecalho instanceof HTMLElement)) {
    throw new Error('[landing] Cabeçalho [data-cabecalho] ausente.')
  }
  const atualizar = () =>
    cabecalho.toggleAttribute('data-rolou', window.scrollY > ROLAGEM_PARA_LINHA)
  window.addEventListener('scroll', atualizar, { passive: true })
  atualizar()
  return () => window.removeEventListener('scroll', atualizar)
}

/** Link para #proposta rola até o pedido e foca o primeiro campo da etapa ativa. */
function irAoFormulario(): () => void {
  const alvo = document.getElementById('proposta')
  if (!alvo) return () => undefined // contato e 404: o pedido mora na página de proposta
  const aoClicar = (evento: MouseEvent) => {
    const link =
      evento.target instanceof Element ? evento.target.closest('a[href="#proposta"]') : null
    if (!link) return
    evento.preventDefault()
    alvo.scrollIntoView({ behavior: 'smooth', block: 'start' })
    alvo
      .querySelector<HTMLElement>('.fp-etapa:not([inert]) :is(input, select)')
      ?.focus({ preventScroll: true })
  }
  document.addEventListener('click', aoClicar)
  return () => document.removeEventListener('click', aoClicar)
}

const PARTES: ReadonlyArray<readonly [origem: string, ligar: () => () => void]> = [
  ['entradas', revelarAoEntrar],
  ['cabeçalho', linhaDoCabecalho],
  ['atalho do formulário', irAoFormulario],
]

export function ligarLanding(reportar: Reportar): () => void {
  const desligar: Array<() => void> = []
  for (const [origem, ligar] of PARTES) {
    try {
      desligar.push(ligar())
    } catch (erro) {
      reportar(erro, `landing:${origem}`)
    }
  }
  // O esqueleto libera os .entrada quando html.motion chega; aqui não há o que esperar.
  document.documentElement.classList.remove('sem-js')
  document.documentElement.classList.add('js', 'motion')
  return () => {
    for (const parte of desligar.reverse()) parte()
  }
}
