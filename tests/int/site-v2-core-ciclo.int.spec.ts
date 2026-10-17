import { fireEvent } from '@testing-library/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { iniciarMenu } from '@/site/core/cabecalho'
import { iniciarImpressao } from '@/site/core/impressao'
import { DesmontadoAntesDoPronto, marcarMotionQuandoPronto, vigiarAltura } from '@/site/core/motion'
import { alvoDaAncora, vigiarPrimeiraInteracao } from '@/site/core/posicao'
import { iniciarTema } from '@/site/core/tema'

const CABECALHO = `
  <header data-cabecalho data-tema="claro">
    <button data-menu aria-expanded="false">Menu</button>
    <nav class="painel-menu"><a href="/semog">A Semog</a></nav>
  </header>`

beforeEach(() => {
  document.body.innerHTML = `${CABECALHO}<main><section id="ranking" data-tema="claro"></section></main>`
  document.documentElement.classList.remove('motion')
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('posição na montagem', () => {
  it('âncora malformada não lança e não acha nada; âncora válida acha a seção', () => {
    expect(alvoDaAncora('#%E0%A4%A')).toBeNull()
    expect(alvoDaAncora('#')).toBeNull()
    expect(alvoDaAncora('#ranking')).toBe(document.getElementById('ranking'))
  })

  it('a vigia de interação desligada não marca mais nada', () => {
    const primeira = vigiarPrimeiraInteracao()
    primeira.desligar()
    const segunda = vigiarPrimeiraInteracao()
    window.dispatchEvent(new KeyboardEvent('keydown'))
    expect(segunda.rolou()).toBe(true)
    expect(primeira.rolou()).toBe(false)
    segunda.desligar()
  })
})

describe('menu do cabeçalho', () => {
  it('abre, fecha com Esc devolvendo o foco, e para de responder depois de desligar', () => {
    const desligar = iniciarMenu()
    const botao = document.querySelector('[data-menu]')
    if (!(botao instanceof HTMLElement)) throw new Error('botão ausente no palco do teste')
    fireEvent.click(botao)
    expect(botao.getAttribute('aria-expanded')).toBe('true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(botao.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(botao)
    desligar()
    fireEvent.click(botao)
    expect(botao.getAttribute('aria-expanded')).toBe('false')
  })

  it('sem cabeçalho, diz por quê em vez de seguir mudo', () => {
    document.body.innerHTML = '<main></main>'
    expect(() => iniciarMenu()).toThrow(/data-menu/)
  })
})

describe('tema, impressão, motion e altura', () => {
  it('o tema solta o ouvinte de refresh ao desligar', () => {
    const adicionar = vi.spyOn(ScrollTrigger, 'addEventListener')
    const remover = vi.spyOn(ScrollTrigger, 'removeEventListener')
    const desligar = iniciarTema(null)
    const ouvinte = adicionar.mock.calls.find(([evento]) => evento === 'refresh')?.[1]
    expect(ouvinte).toBeTypeOf('function')
    desligar()
    // A MESMA função que entrou tem de sair; remover qualquer outra função não soltaria nada.
    expect(remover).toHaveBeenCalledWith('refresh', ouvinte)
  })

  it('a impressão abre os details e, depois de desligada, não mexe mais', () => {
    document.body.insertAdjacentHTML('beforeend', '<details id="d"><summary>x</summary></details>')
    const detalhe = document.getElementById('d')
    if (!(detalhe instanceof HTMLDetailsElement)) throw new Error('details ausente')
    const desligar = iniciarImpressao(vi.fn())
    window.dispatchEvent(new Event('beforeprint'))
    expect(detalhe.open).toBe(true)
    window.dispatchEvent(new Event('afterprint'))
    expect(detalhe.open).toBe(false)
    desligar()
    window.dispatchEvent(new Event('beforeprint'))
    expect(detalhe.open).toBe(false)
  })

  it('html.motion entra quando a página está pronta, e não entra se a montagem foi cancelada', async () => {
    expect(document.readyState).toBe('complete')
    const cancelada = marcarMotionQuandoPronto()
    cancelada.cancelar()
    await expect(cancelada.pronto).rejects.toBeInstanceOf(DesmontadoAntesDoPronto)
    expect(document.documentElement.classList.contains('motion')).toBe(false)
    const valendo = marcarMotionQuandoPronto()
    await valendo.pronto
    expect(document.documentElement.classList.contains('motion')).toBe(true)
  })

  it('a vigia de altura desconecta o observador ao desligar', () => {
    const desconexoes: string[] = []
    class ResizeObserverFalso {
      observe = (): void => undefined
      unobserve = (): void => undefined
      disconnect = (): void => {
        desconexoes.push('desconectou')
      }
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverFalso)
    const desligar = vigiarAltura()
    desligar()
    expect(desconexoes).toEqual(['desconectou'])
  })
})
