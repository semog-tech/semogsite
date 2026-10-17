import { afterEach, describe, expect, it, vi } from 'vitest'
import Pagina, { metadata } from '@/app/(site)/(app)/previa-v2/garante/page'
import { CENAS_GARANTE } from '@/site/cenas/paginas/garante'
import { metadadosInstitucionais } from '@/site/seo/institucional'
import { conferirPagina, type SecaoEsperada } from './helpers/paginas'

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

const FORMULARIO = ['form', '.fp-moldura'] as const

const SECOES: SecaoEsperada[] = [
  { id: 'semog-garante', arquivo: 'garante/01-abertura' },
  { id: 'caixa-do-condominio', arquivo: 'garante/02-caixa' },
  { id: 'papeis', arquivo: 'garante/03-papeis' },
  {
    id: 'duvidas-garante',
    arquivo: 'garante/04-duvidas',
    diferencas: { semClasses: ['a-confirmar'] },
  },
  {
    id: 'proposta',
    arquivo: '08-proposta',
    diferencas: { ignorar: FORMULARIO, comClasses: ['proposta-metades'] },
  },
]

describe('Semog Garante na prévia', () => {
  it('em produção responde 404, nunca é indexada e o <head> é o de hoje', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
    expect(metadata.title).toBe(metadadosInstitucionais('garante').title)
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => Pagina()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('reproduz as seções do protótipo, na ordem, com as cenas certas', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    conferirPagina(<Pagina />, { dataPagina: 'garante', secoes: SECOES, cenas: CENAS_GARANTE })
  })

  it('as dúvidas respondem como o Leandro respondeu, sem selo', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const container = conferirPagina(<Pagina />, { dataPagina: 'garante', secoes: SECOES })
    const duvidas = container.querySelector('#duvidas-garante')?.textContent ?? ''
    expect(duvidas).toContain('o contrato é mensal')
    expect(duvidas).toContain('“Semog Garante”')
    expect(duvidas).toContain('1% do valor total da arrecadação')
    expect(duvidas).not.toContain('A CONFIRMAR')
    expect(container.textContent).not.toMatch(/assume a cobrança/)
  })
})
