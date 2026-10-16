import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  alturaDoCabecalho,
  fracaoLida,
  iniciarFotosDaImpressao,
  iniciarIndice,
  iniciarProgresso,
  ligarLeitura,
} from '@/site/leitura/ligar-leitura'

/** Retângulo com só o que o código lê (top e height); o resto é coerente. */
function retangulo(top: number, height = 0): DOMRect {
  return {
    x: 0,
    y: top,
    top,
    bottom: top + height,
    left: 0,
    right: 100,
    width: 100,
    height,
    toJSON: () => ({}),
  }
}

function fixarRetangulo(elemento: Element, top: number, height = 0) {
  vi.spyOn(elemento, 'getBoundingClientRect').mockReturnValue(retangulo(top, height))
}

function rolar() {
  window.dispatchEvent(new Event('scroll'))
}

beforeEach(() => {
  document.documentElement.className = 'sem-js'
})

/** O jsdom não rola: a posição da janela é posta à mão (propriedade comum, não getter). */
function posicionarJanela(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  posicionarJanela(0)
  document.body.innerHTML = ''
})

describe('fração lida do texto', () => {
  it('0 com o início sob o cabeçalho, 1 com o fim no pé da tela', () => {
    expect(fracaoLida({ top: 68, height: 2000 }, 900, 68)).toBe(0)
    expect(fracaoLida({ top: 68 - 1168, height: 2000 }, 900, 68)).toBe(1)
    expect(fracaoLida({ top: 68 - 584, height: 2000 }, 900, 68)).toBeCloseTo(0.5)
  })

  it('nunca sai de 0 a 1, e texto mais curto que a tela é 0 ou 1', () => {
    expect(fracaoLida({ top: 500, height: 2000 }, 900, 68)).toBe(0)
    expect(fracaoLida({ top: -9000, height: 2000 }, 900, 68)).toBe(1)
    expect(fracaoLida({ top: 100, height: 300 }, 900, 68)).toBe(0)
    expect(fracaoLida({ top: 10, height: 300 }, 900, 68)).toBe(1)
  })
})

describe('barra de progresso', () => {
  it('acompanha a rolagem e para de acompanhar no desligamento', () => {
    document.body.innerHTML =
      '<div class="artigo-progresso"><span data-progresso></span></div><div data-corpo-leitura></div>'
    const barra = document.querySelector<HTMLElement>('[data-progresso]')
    const corpo = document.querySelector('[data-corpo-leitura]')
    if (!barra || !corpo) throw new Error('marcação do teste')
    fixarRetangulo(corpo, -1000, 2000)
    const desligar = iniciarProgresso()
    const esperado = fracaoLida(retangulo(-1000, 2000), window.innerHeight, alturaDoCabecalho())
    expect(barra.style.transform).toBe(`scaleX(${esperado})`)
    desligar()
    fixarRetangulo(corpo, 0, 2000)
    rolar()
    expect(barra.style.transform).toBe(`scaleX(${esperado})`)
  })

  it('no índice do blog (sem texto corrido) não liga nada; com só uma das peças, falha alto', () => {
    expect(() => iniciarProgresso()()).not.toThrow()
    document.body.innerHTML = '<div data-corpo-leitura></div>'
    expect(() => iniciarProgresso()).toThrow('[data-progresso]')
  })
})

describe('índice "Neste texto"', () => {
  function montarIndice() {
    document.body.innerHTML = `
      <nav data-indice><ol>
        <li><a href="#um">Um</a></li>
        <li><a href="#dois">Dois</a></li>
      </ol></nav>
      <h2 id="um">Um</h2><h2 id="dois">Dois</h2>`
    const [linkUm, linkDois] = Array.from(document.querySelectorAll('[data-indice] a'))
    const um = document.getElementById('um')
    const dois = document.getElementById('dois')
    if (!linkUm || !linkDois || !um || !dois) throw new Error('marcação do teste')
    return { linkUm, linkDois, um, dois }
  }

  it('marca o título que já passou da linha de leitura, e só ele', () => {
    const { linkUm, linkDois, um, dois } = montarIndice()
    fixarRetangulo(um, 100)
    fixarRetangulo(dois, 500)
    iniciarIndice(vi.fn())
    expect(linkUm.getAttribute('aria-current')).toBe('location')
    expect(linkDois.hasAttribute('aria-current')).toBe(false)
    fixarRetangulo(dois, 150)
    rolar()
    expect(linkUm.hasAttribute('aria-current')).toBe(false)
    expect(linkDois.getAttribute('aria-current')).toBe('location')
  })

  it('link do índice sem alvo é reportado e os outros continuam funcionando', () => {
    const { linkUm, um, dois } = montarIndice()
    dois.remove()
    fixarRetangulo(um, 100)
    const reportar = vi.fn()
    iniciarIndice(reportar)
    expect(reportar).toHaveBeenCalledTimes(1)
    expect(reportar.mock.calls[0]?.[1]).toBe('índice')
    expect(linkUm.getAttribute('aria-current')).toBe('location')
  })
})

describe('fotos para impressão', () => {
  it('as fotos adiadas passam a carregar 2 s depois da carga e de novo antes de imprimir', () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<img loading="lazy" alt="" /><img loading="lazy" alt="" />'
    const desligar = iniciarFotosDaImpressao()
    expect(document.querySelectorAll('img[loading="lazy"]')).toHaveLength(2)
    vi.advanceTimersByTime(2000)
    expect(document.querySelectorAll('img[loading="eager"]')).toHaveLength(2)
    document.body.insertAdjacentHTML('beforeend', '<img loading="lazy" alt="" />')
    window.dispatchEvent(new Event('beforeprint'))
    expect(document.querySelectorAll('img[loading="lazy"]')).toHaveLength(0)
    desligar()
  })
})

describe('ligarLeitura', () => {
  it('libera as entradas na hora (js + motion) e uma peça que falha não derruba as outras', () => {
    document.body.innerHTML = '<div data-corpo-leitura></div>'
    const reportar = vi.fn()
    const desligar = ligarLeitura(reportar)
    const html = document.documentElement.classList
    expect(html.contains('sem-js')).toBe(false)
    expect(html.contains('js')).toBe(true)
    expect(html.contains('motion')).toBe(true)
    // Sem [data-cabecalho] e com o corpo sem a barra: duas peças reportadas, nenhuma exceção.
    expect(reportar.mock.calls.map((chamada) => chamada[1])).toEqual([
      'cabeçalho',
      'progresso de leitura',
    ])
    expect(() => desligar()).not.toThrow()
  })

  it('o cabeçalho ganha fundo depois do primeiro respiro de rolagem', () => {
    document.body.innerHTML = '<header data-cabecalho></header>'
    const cabecalho = document.querySelector('[data-cabecalho]')
    const desligar = ligarLeitura(vi.fn())
    expect(cabecalho?.hasAttribute('data-rolou')).toBe(false)
    posicionarJanela(40)
    rolar()
    expect(cabecalho?.hasAttribute('data-rolou')).toBe(true)
    desligar()
  })
})
