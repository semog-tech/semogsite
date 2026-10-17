import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type Lenis from 'lenis'
import { aoRolar } from './util'

/* Tema do cabeçalho: copia o data-tema da <section> sob a linha do cabeçalho e marca o link da
   seção atual. Lê o DOM a cada quadro de rolagem, então funciona com pin. Também liga o fundo
   do cabeçalho (data-rolou) depois do primeiro respiro de rolagem. */

const ROLAGEM_PARA_FUNDO = 8

function secaoSobLinha(secoes: HTMLElement[], y: number): HTMLElement | null {
  for (const secao of secoes) {
    const caixa = secao.getBoundingClientRect()
    if (caixa.top <= y && caixa.bottom > y) return secao
  }
  return null
}

function aplicar(cabecalho: HTMLElement, secao: HTMLElement): void {
  const tema = secao.dataset.tema
  if (tema && cabecalho.dataset.tema !== tema) cabecalho.dataset.tema = tema
  for (const link of cabecalho.querySelectorAll('[data-secao-link]')) {
    if (link.getAttribute('data-secao-link') === secao.id) {
      link.setAttribute('aria-current', 'location')
    } else link.removeAttribute('aria-current')
  }
}

/** Liga a troca de tema. Chame depois que as cenas montaram seus pins. */
export function iniciarTema(lenis: Lenis | null): () => void {
  const cabecalho = document.querySelector('[data-cabecalho]')
  if (!(cabecalho instanceof HTMLElement)) {
    throw new Error('[tema] Cabeçalho [data-cabecalho] não encontrado.')
  }
  const secoes = Array.from(
    document.querySelectorAll<HTMLElement>('main section[data-tema], footer[data-tema]'),
  )
  const atualizar = () => {
    const secao = secaoSobLinha(secoes, cabecalho.getBoundingClientRect().bottom + 1)
    if (secao) aplicar(cabecalho, secao)
    cabecalho.toggleAttribute('data-rolou', window.scrollY > ROLAGEM_PARA_FUNDO)
  }
  const desligarRolagem = aoRolar(atualizar, lenis)
  // Um refresh pode mover as seções sem evento de rolagem (cena que cresceu, pin recalculado).
  ScrollTrigger.addEventListener('refresh', atualizar)
  atualizar()
  return () => {
    desligarRolagem()
    ScrollTrigger.removeEventListener('refresh', atualizar)
  }
}
