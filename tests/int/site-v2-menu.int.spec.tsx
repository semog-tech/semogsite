import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LARGURA_DO_MENU } from '@/site/core/cabecalho'
import { Cabecalho } from '@/site/layout/Cabecalho'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

type MidiaFalsa = { matches: boolean; mudar: (estreita: boolean) => void }

function midiaFalsa(): MidiaFalsa {
  const ouvintes = new Set<() => void>()
  const midia = {
    matches: true,
    media: LARGURA_DO_MENU,
    addEventListener: (_tipo: string, ouvinte: () => void) => ouvintes.add(ouvinte),
    removeEventListener: (_tipo: string, ouvinte: () => void) => ouvintes.delete(ouvinte),
    mudar(estreita: boolean) {
      midia.matches = estreita
      for (const ouvinte of ouvintes) ouvinte()
    },
  }
  return midia
}

let midia: MidiaFalsa
beforeEach(() => {
  midia = midiaFalsa()
  // `as`: o dublê só implementa o que iniciarMenu usa de MediaQueryList.
  vi.spyOn(window, 'matchMedia').mockImplementation(() => midia as unknown as MediaQueryList)
})
afterEach(() => {
  vi.restoreAllMocks()
})

function abrirMenu() {
  render(<Cabecalho destinoProposta="/proposta" />)
  const botao = screen.getByRole('button', { name: 'Menu' })
  fireEvent.click(botao)
  return botao
}

describe('menu do celular (Final da fase 1, prazo antes da virada)', () => {
  it('fecha quando a tela alarga além do ponto do menu (aria-expanded não fica preso)', () => {
    const botao = abrirMenu()
    expect(botao.getAttribute('aria-expanded')).toBe('true')
    midia.mudar(false)
    expect(botao.getAttribute('aria-expanded')).toBe('false')
    expect(document.querySelector('[data-cabecalho]')?.hasAttribute('data-menu-aberto')).toBe(false)
  })

  it('com o menu aberto, Tab e Shift+Tab ficam entre o botão e os itens do painel', () => {
    const botao = abrirMenu()
    const itens = Array.from(
      document.querySelectorAll<HTMLElement>('#painel-menu a[href], #painel-menu button'),
    )
    const ultimo = itens[itens.length - 1]
    ultimo.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(botao)
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(ultimo)
  })

  it('Esc fecha e devolve o foco ao botão; escolher o "Sou cliente" no painel fecha o menu', () => {
    const botao = abrirMenu()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(botao.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(botao)
    fireEvent.click(botao)
    const cliente = document.querySelector<HTMLElement>('#painel-menu .painel-cliente')
    if (!cliente) throw new Error('"Sou cliente" ausente no painel')
    fireEvent.click(cliente)
    expect(botao.getAttribute('aria-expanded')).toBe('false')
  })
})
