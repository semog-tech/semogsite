import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { entradaDe } from '@/site/inventario'
import { Cabecalho } from '@/site/layout/Cabecalho'
import { Rodape } from '@/site/layout/Rodape'
import { SimbolosSvg } from '@/site/layout/SimbolosSvg'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

function linksInternos(raiz: HTMLElement): string[] {
  return Array.from(raiz.querySelectorAll('a[href^="/"]')).map((a) => a.getAttribute('href') ?? '')
}

describe('cabeçalho do site v2', () => {
  it('todo link interno cai numa página do inventário', () => {
    const { container } = render(<Cabecalho destinoProposta="/proposta" />)
    const internos = linksInternos(container)
    expect(internos.length).toBeGreaterThan(10)
    for (const href of internos) {
      expect(entradaDe(href.split('#')[0] || '/')?.tipo, href).toBe('pagina')
    }
  })

  it('marca a página atual nos dois menus e só nela', () => {
    render(<Cabecalho atual="garante" destinoProposta="/proposta" />)
    const garante = screen.getAllByRole('link', { name: 'Garante' })
    expect(garante).toHaveLength(2)
    for (const link of garante) expect(link.getAttribute('aria-current')).toBe('page')
    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(2)
  })

  it('"Seja Semog" vai para a proposta da própria página quando ela existe', () => {
    const { unmount } = render(<Cabecalho destinoProposta="#proposta" />)
    expect(screen.getByRole('link', { name: 'Seja Semog' }).getAttribute('href')).toBe('#proposta')
    unmount()
    render(<Cabecalho destinoProposta="/proposta" />)
    expect(screen.getByRole('link', { name: 'Seja Semog' }).getAttribute('href')).toBe('/proposta')
  })

  it('o logo é um link com nome acessível, no cabeçalho e no rodapé', () => {
    render(
      <>
        <Cabecalho destinoProposta="/proposta" />
        <Rodape destinoProposta="/proposta" />
      </>,
    )
    const marcas = screen.getAllByRole('link', { name: 'Semog, página inicial' })
    expect(marcas.map((a) => a.getAttribute('href'))).toEqual(['/', '/'])
  })

  it('o botão Menu abre e fecha o painel, e Esc devolve o foco', () => {
    render(<Cabecalho destinoProposta="/proposta" />)
    const botao = screen.getByRole('button', { name: 'Menu' })
    fireEvent.click(botao)
    expect(botao.getAttribute('aria-expanded')).toBe('true')
    expect(document.querySelector('[data-cabecalho]')?.hasAttribute('data-menu-aberto')).toBe(true)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(botao.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(botao)
  })
})

describe('rodapé do site v2', () => {
  it('lista as quatro Unidades Semog com link para a landing de cada cidade', () => {
    const { container } = render(<Rodape destinoProposta="/proposta" />)
    const cidades = linksInternos(container).filter((href) =>
      href.startsWith('/administradora-de-condominios-'),
    )
    expect(cidades).toEqual([
      '/administradora-de-condominios-recife',
      '/administradora-de-condominios-joao-pessoa',
      '/administradora-de-condominios-campina-grande',
      '/administradora-de-condominios-belem',
    ])
    for (const href of linksInternos(container)) expect(entradaDe(href)?.tipo, href).toBe('pagina')
  })

  it('não traz a nota de protótipo do esqueleto original', () => {
    render(<Rodape destinoProposta="/proposta" />)
    expect(document.body.textContent).not.toMatch(/Protótipo/)
    expect(document.body.textContent).toContain('Semog · administradora de condomínios desde 1991.')
  })
})

describe('logo', () => {
  it('a geometria do símbolo é a do logo original, sem recompor', () => {
    const referencia = readFileSync(
      path.join(process.cwd(), '_reference', 'semog-logo.svg'),
      'utf8',
    ).replace(/\r\n?/g, '\n')
    const dDaReferencia = Array.from(referencia.matchAll(/\sd="([^"]+)"/g), (m) => m[1])
    const { container } = render(<SimbolosSvg />)
    const dDoSimbolo = Array.from(container.querySelectorAll('#logo-semog path'), (p) =>
      p.getAttribute('d'),
    )
    expect(dDoSimbolo).toEqual(dDaReferencia)
    expect(container.querySelectorAll('#logo-semog rect')).toHaveLength(3)
  })
})
