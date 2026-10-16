import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PaginaPrevia, { metadata } from '@/app/(site)/(app)/previa-v2/page'
import { PATAMARES_RANKING } from '@/site/cenas/home/ranking'
import { previaLiberada } from '@/site/previa'
import { procurarTermosVedados } from './helpers/identidade'

vi.mock('@/site/runner/RunnerDeCenas', () => ({ RunnerDeCenas: () => null }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/app/(site)/_actions/proposta-duas-etapas', () => ({
  enviarEtapa1: vi.fn(),
  enviarEtapa2: vi.fn(),
  enviarPropostaCompleta: vi.fn(),
}))
vi.mock('@/components/forms/Turnstile', () => ({ Turnstile: () => null }))

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('rota de prévia do site v2', () => {
  it('fica fechada por padrão; abre só em preview, development e local', () => {
    expect(previaLiberada('production', undefined)).toBe(false)
    expect(previaLiberada('preview', '1')).toBe(true)
    expect(previaLiberada('development', undefined)).toBe(true)
    expect(previaLiberada(undefined, undefined)).toBe(true)
    // Na Vercel sem VERCEL_ENV (variáveis de sistema desligadas): fechada.
    expect(previaLiberada(undefined, '1')).toBe(false)
    expect(previaLiberada('staging', undefined)).toBe(false)
  })

  it('em produção a página responde 404', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => PaginaPrevia()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('nunca é indexada', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })

  it('fora de produção, monta cabeçalho, main da página, a seção do ranking e rodapé', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    render(<PaginaPrevia />)
    expect(document.querySelector('[data-cabecalho]')).not.toBeNull()
    expect(document.querySelector('main#conteudo')?.getAttribute('data-pagina')).toBe('home')
    expect(document.querySelector('section#ranking[data-tema="claro"]')).not.toBeNull()
    expect(document.querySelector('footer[data-tema="marinho"]')).not.toBeNull()
  })

  it('a prévia mostra o pedido de proposta em duas etapas, sem WhatsApp de proposta', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const { container } = render(<PaginaPrevia />)
    const secao = container.querySelector('#proposta')
    expect(secao?.querySelector('form[data-etapa-ativa="1"]')).toBeTruthy()
    expect(secao?.innerHTML).not.toContain('wa.me')
    expect(secao?.innerHTML).not.toContain('3003-4506')
  })

  it('toda cena registrada para a prévia tem a sua seção na página', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    render(<PaginaPrevia />)
    for (const id of ['ranking']) {
      expect(document.getElementById(id), id).not.toBeNull()
    }
  })
})

describe('seção do ranking (texto completo sem JS)', () => {
  it('traz a chamada, a manchete, os ciclos e a foto do conteúdo', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    render(<PaginaPrevia />)
    expect(
      screen.getByRole('heading', { level: 2, name: /mais bem posicionada/ }).textContent,
    ).toBe('A administradora mais bem posicionada do Norte e Nordeste.')
    const manchete = document.querySelector('.ranking-manchete')?.textContent ?? ''
    expect(manchete.replace(/\s+/g, ' ').trim()).toBe('5º entre mais de 3.500 administradoras')
    expect(document.body.textContent).toContain('Ciclo 2026/27')
    expect(document.body.textContent).toContain('Ciclo 2024/25')
    // Os ciclos saem de ranking.ciclos, do mais antigo ao atual, e só o atual é destacado.
    const ciclos = Array.from(document.querySelectorAll('.ranking-ciclos li'))
    expect(ciclos).toHaveLength(3)
    expect(ciclos[0]?.textContent).toContain('Ciclo 2024/25')
    expect(ciclos[2]?.textContent).toContain('Ciclo 2026/27')
    expect(ciclos.map((li) => li.classList.contains('ranking-ciclo-atual'))).toEqual([
      false,
      false,
      true,
    ])
    const foto = document.querySelector('.ranking-foto img')
    expect(foto?.getAttribute('src')).toBe('/site-v2/fotos/reconhecimento-semog.webp')
    expect(foto?.getAttribute('alt')).toBe(
      'Equipe da Semog no palco do Superlógica Next 2026 com a placa do G20 Condo',
    )
  })

  it('nenhum termo vedado no texto renderizado', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    render(<PaginaPrevia />)
    expect(procurarTermosVedados(document.body.textContent ?? '')).toEqual([])
  })

  it('os patamares do toque são os do roteiro da cena', () => {
    expect(PATAMARES_RANKING).toHaveLength(5)
    const esperados = [0, 0.25, 0.49, 0.71, 1]
    PATAMARES_RANKING.forEach((ponto, i) => {
      expect(ponto).toBeCloseTo(esperados[i], 10)
    })
  })
})
