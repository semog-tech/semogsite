import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { VideoDoExperience } from '@/site/conteudo/conteudo'
import { VideoQuandoPerto } from '@/site/secoes/home/VideoQuandoPerto'
import { fraseDosNumerosDaPrestacao } from '@/site/secoes/tecnologia/numeros'

const VIDEO: VideoDoExperience = {
  src: '/site-v2/videos/semog-experience-26.mp4',
  poster: '/site-v2/videos/semog-experience-26-poster.webp',
  legenda: 'Vídeo de teste.',
  largura: 720,
  altura: 1280,
}

type Avisar = (entradas: Array<{ isIntersecting: boolean }>) => void

/** IntersectionObserver de mentira: guarda o callback e as opções para o teste disparar. */
function observadorFalso() {
  const chamadas: { avisar: Avisar; opcoes?: IntersectionObserverInit }[] = []
  const desligar = vi.fn()
  class Observador {
    constructor(avisar: Avisar, opcoes?: IntersectionObserverInit) {
      chamadas.push({ avisar, opcoes })
    }
    observe() {}
    disconnect() {
      desligar()
    }
  }
  vi.stubGlobal('IntersectionObserver', Observador)
  return { chamadas, desligar }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('o reel do Experience 26 na Comunidade', () => {
  it('não pede o vídeo no carregamento: só a capa, até o quadro se aproximar da tela', () => {
    const { chamadas, desligar } = observadorFalso()
    const { container } = render(<VideoQuandoPerto video={VIDEO} />)
    const video = container.querySelector('video')
    expect(video?.getAttribute('src')).toBeNull()
    expect(video?.getAttribute('poster')).toBe(VIDEO.poster)
    expect(video?.getAttribute('aria-label')).toBe(VIDEO.legenda)
    expect(chamadas).toHaveLength(1)
    expect(chamadas[0]?.opcoes?.rootMargin).toBe('0px 0px 100% 0px')

    act(() => chamadas[0]?.avisar([{ isIntersecting: false }]))
    expect(video?.getAttribute('src')).toBeNull()

    act(() => chamadas[0]?.avisar([{ isIntersecting: true }]))
    expect(video?.getAttribute('src')).toBe(VIDEO.src)
    expect(video?.hasAttribute('loop')).toBe(true)
    expect(video?.hasAttribute('autoplay')).toBe(true)
    expect(video?.muted).toBe(true)
    // Com o src posto, o observador sai: nada fica vigiando a rolagem.
    expect(desligar).toHaveBeenCalled()
  })
})

describe('a frase dos números da nova prestação', () => {
  it('usa o dado e a data de corte, com milhar no formato brasileiro', () => {
    expect(
      fraseDosNumerosDaPrestacao({ prestacoes: 1234, condominios: 250, corte: 'outubro de 2026' }),
    ).toBe('Até outubro de 2026, foram mais de 1.234 prestações em 250 condomínios.')
  })
})
