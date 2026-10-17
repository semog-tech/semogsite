import { afterEach, describe, expect, it, vi } from 'vitest'
import Pagina, { metadata } from '@/app/(site)/(app)/previa-v2/solucoes/page'
import { CENAS_SOLUCOES } from '@/site/cenas/paginas/solucoes'
import { conteudo } from '@/site/conteudo/conteudo'
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

const SECOES: SecaoEsperada[] = [
  { id: 'solucoes', arquivo: null },
  { id: 'tipos-de-condominio', arquivo: null },
  { id: 'porque-semog', arquivo: null },
  { id: 'prestacao', arquivo: null },
  { id: 'garante', arquivo: null },
  { id: 'aplicativo', arquivo: null },
  { id: 'software-de-dono', arquivo: null },
  { id: 'beneficios', arquivo: null },
  { id: 'perguntas-solucoes', arquivo: null },
  {
    id: 'proposta',
    arquivo: '08-proposta',
    diferencas: { ignorar: ['form', '.fp-moldura'], comClasses: ['proposta-metades'] },
  },
]

describe('/solucoes na prévia', () => {
  it('em produção responde 404, nunca é indexada e o <head> é o de hoje', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
    expect(metadata.title).toBe(metadadosInstitucionais('solucoes').title)
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => Pagina()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('tem as seções da página no ar, reescritas, com a proposta no fim', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    conferirPagina(<Pagina />, { dataPagina: 'solucoes', secoes: SECOES, cenas: CENAS_SOLUCOES })
  })

  it('nenhuma das frases vetadas da página no ar sobrou', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const container = conferirPagina(<Pagina />, { dataPagina: 'solucoes', secoes: SECOES })
    const texto = container.textContent ?? ''
    for (const vetada of [
      /o único produto/i,
      /primeiro chatbot/i,
      /nenhuma (outra )?administradora/i,
      /inadimplência zero/i,
      /previsto para 2026/i,
      /quando a Semog assume/i,
      /internet mais barata/i,
    ]) {
      expect(texto, String(vetada)).not.toMatch(vetada)
    }
    expect(texto).toContain(conteudo.solucoesPagina.clube.texto)
    for (const ancora of [
      'residenciais',
      'comerciais',
      'associacoes',
      'prestacao',
      'garante',
      'aplicativo',
      'beneficios',
    ]) {
      expect(container.querySelector(`#${ancora}`), ancora).not.toBeNull()
    }
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(container.querySelectorAll('#perguntas-solucoes details')).toHaveLength(
      conteudo.solucoesPagina.perguntas.itens.length,
    )
  })

  it('tem link interno no rodapé (decisão de 16/10/2026) e fica fora do menu, como o protótipo', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const container = conferirPagina(<Pagina />, { dataPagina: 'solucoes', secoes: SECOES })
    expect(container.querySelector('footer a[href="/previa-v2/solucoes"]')?.textContent).toBe(
      'Soluções',
    )
    expect(container.querySelector('header a[href="/previa-v2/solucoes"]')).toBeNull()
  })
})
