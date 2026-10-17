import { afterEach, describe, expect, it, vi } from 'vitest'
import Pagina, { metadata } from '@/app/(site)/(app)/previa-v2/administracao-de-condominios/page'
import { CENAS_GESTAO } from '@/site/cenas/paginas/gestao'
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
  { id: 'administracao-de-condominios', arquivo: 'gestao/01-abertura' },
  { id: 'mesa-do-sindico', arquivo: 'gestao/02-mesa' },
  { id: 'quem-atende', arquivo: 'gestao/03-atende' },
  { id: 'troca-de-administradora', arquivo: 'gestao/04-troca' },
  { id: 'perguntas-gestao', arquivo: 'gestao/05-perguntas' },
  {
    id: 'proposta',
    arquivo: '08-proposta',
    diferencas: { ignorar: FORMULARIO, comClasses: ['proposta-metades'] },
  },
]

describe('Gestão na prévia', () => {
  it('em produção responde 404, nunca é indexada e o <head> é o de hoje', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
    expect(metadata.title).toBe(metadadosInstitucionais('administracao-de-condominios').title)
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => Pagina()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('reproduz as seções do protótipo, na ordem, com as cenas certas', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    conferirPagina(<Pagina />, {
      dataPagina: 'gestao',
      secoes: SECOES,
      cenas: CENAS_GESTAO,
    })
  })

  it('o texto segue as respostas do Leandro', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const container = conferirPagina(<Pagina />, { dataPagina: 'gestao', secoes: SECOES })
    const texto = container.textContent ?? ''
    expect(texto).toContain('Suporte jurídico com escritório parceiro')
    expect(texto).toContain('Acesso fácil aos sócios')
    expect(texto).toContain('cotações e orçamentos de fornecedores feitos pela Semog')
    expect(texto).not.toMatch(/comparad/)
  })
})
