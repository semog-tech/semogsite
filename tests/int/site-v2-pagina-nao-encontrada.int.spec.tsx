import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Previa, {
  metadata as metadataDaPrevia,
} from '@/app/(site)/(landing)/previa-v2/nao-encontrada/page'
import NaoEncontradaDoSite, { metadata as metadataDo404 } from '@/app/(site)/not-found'
import { conteudo } from '@/site/conteudo/conteudo'
import { conferirPagina, type SecaoEsperada } from './helpers/paginas'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

afterEach(() => {
  vi.unstubAllEnvs()
})

const SECOES: SecaoEsperada[] = [
  {
    id: 'nao-encontrada',
    arquivo: 'nao-encontrada/01-pagina',
    // Desvio de design (passada 4b): o texto sobe para junto do título e o pedido de proposta sai
    // da fileira para o destaque ao lado dele; a fileira fica com quatro.
    diferencas: {
      semClasses: ['link-seta'],
      comClasses: ['ne-cartao', 'ne-cabeca', 'ne-principal'],
      contagemLivre: ['<p>', '<li>', 'ne-texto', 'seta'],
    },
  },
]

describe('404 nova do site v2', () => {
  it('o título não afirma que a página existiu; traz os cinco caminhos do protótipo, sem "Sou cliente" no corpo', () => {
    const container = conferirPagina(<NaoEncontradaDoSite />, {
      dataPagina: 'nao-encontrada',
      secoes: SECOES,
    })
    const titulo = container.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim()
    expect(titulo).toBe(`${conteudo.naoEncontrada.titulo} ${conteudo.naoEncontrada.enfase}`)
    expect(titulo).not.toMatch(/não existe mais/)
    const cartoes = Array.from(container.querySelectorAll('#nao-encontrada .ne-cartao'))
    expect(cartoes).toHaveLength(5)
    expect(cartoes.map((c) => c.querySelector('strong')?.textContent)).toEqual([
      'Pedir proposta',
      'Página inicial',
      'Unidades Semog',
      'Blog',
      'Fale com a gente',
    ])
    // Pedir proposta é o caminho principal: vem antes, ao lado do título, fora da fileira.
    expect(cartoes[0]?.classList.contains('ne-principal')).toBe(true)
    expect(cartoes[0]?.getAttribute('href')).toBe('/previa-v2/proposta')
    expect(container.querySelectorAll('#nao-encontrada .ne-links .ne-cartao')).toHaveLength(4)
    // O "Sou cliente" fica só no cabeçalho, no rodapé e no Contato (resposta do Leandro, DP6).
    expect(container.querySelector('#nao-encontrada [aria-haspopup="dialog"]')).toBeNull()
    expect(container.querySelector('#nao-encontrada [data-wa-caminho]')).toBeNull()
    expect(cartoes.at(-1)?.getAttribute('href')).toBe('/previa-v2/contato')
  })

  it('o <head> da 404 é próprio e nunca é indexado', () => {
    expect(metadataDo404.title).toBe('Página não encontrada · Semog')
    expect(metadataDo404.robots).toEqual({ index: false, follow: false })
    expect(metadataDaPrevia.robots).toEqual({ index: false, follow: false })
  })

  it('a prévia da 404 abre fora de produção e, em produção, responde 404 (com esta mesma página)', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const { container } = render(<Previa />)
    expect(container.querySelector('#nao-encontrada')).not.toBeNull()
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => Previa()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })
})
