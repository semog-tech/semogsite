import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { executarGanchosImpressao, type Reportar } from './ganchos'

/* Impressão: antes de imprimir, abre todos os <details>, desliga os ScrollTriggers e leva toda
   animação ligada à rolagem ao estado final (quem imprime sem rolar não pode receber texto com
   opacidade zero); depois roda os ganchos das cenas. Ao voltar para a tela, cada animação
   retoma o progresso que tinha. Ouve beforeprint e matchMedia("print"). */

const ESPERA_FOTOS_MS = 2000

/** Fotos lazy fora da tela ainda não baixaram e sairiam como caixa vazia na impressão. */
function carregarFotosAdiadas(): void {
  for (const img of document.querySelectorAll('img[loading="lazy"]')) {
    if (img instanceof HTMLImageElement) img.loading = 'eager'
  }
}

export function iniciarImpressao(reportar: Reportar): () => void {
  let imprimindo = false
  let fechados: HTMLDetailsElement[] = []
  let progressos: Array<[gsap.core.Animation, number]> = []

  const concluirAnimacoes = () => {
    progressos = []
    for (const gatilho of ScrollTrigger.getAll()) {
      gatilho.disable(true)
      const animacao = gatilho.animation
      // Cena fixada volta ao estado inicial do HTML e ajusta o resto com util.aoImprimir.
      if (!animacao || gatilho.pin) continue
      progressos.push([animacao, animacao.progress()])
      animacao.progress(1)
    }
  }
  const preparar = () => {
    if (imprimindo) return
    imprimindo = true
    carregarFotosAdiadas()
    fechados = Array.from(document.querySelectorAll<HTMLDetailsElement>('details:not([open])'))
    for (const detalhe of fechados) detalhe.open = true
    concluirAnimacoes()
    executarGanchosImpressao(reportar)
  }
  const restaurar = () => {
    if (!imprimindo) return
    imprimindo = false
    for (const detalhe of fechados) detalhe.open = false
    fechados = []
    for (const [animacao, progresso] of progressos) animacao.progress(progresso)
    progressos = []
    for (const gatilho of ScrollTrigger.getAll()) gatilho.enable()
    ScrollTrigger.refresh()
  }

  // Depois da carga (para não disputar banda com a primeira dobra), as fotos lazy passam a eager.
  let esperaFotos = 0
  const agendarFotos = () => {
    esperaFotos = window.setTimeout(carregarFotosAdiadas, ESPERA_FOTOS_MS)
  }
  if (document.readyState === 'complete') agendarFotos()
  else window.addEventListener('load', agendarFotos, { once: true })

  const midia = window.matchMedia('print')
  const aoMudarMidia = (evento: MediaQueryListEvent) => (evento.matches ? preparar() : restaurar())
  window.addEventListener('beforeprint', preparar)
  window.addEventListener('afterprint', restaurar)
  midia.addEventListener('change', aoMudarMidia)

  return () => {
    window.clearTimeout(esperaFotos)
    window.removeEventListener('load', agendarFotos)
    window.removeEventListener('beforeprint', preparar)
    window.removeEventListener('afterprint', restaurar)
    midia.removeEventListener('change', aoMudarMidia)
  }
}
