import { afterEach, describe, expect, it, vi } from 'vitest'
import Pagina, { metadata } from '@/app/(site)/(app)/previa-v2/incorporadoras/page'
import { CENAS_INCORPORADORAS } from '@/site/cenas/paginas/incorporadoras'
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

// A legenda da obra (com o selo) e a faixa das construtoras parceiras saem inteiras, por resposta
// do Leandro: as subárvores saem dos dois lados, e o resto da seção continua conferido.
const SECOES: SecaoEsperada[] = [
  {
    id: 'incorporadoras',
    arquivo: 'incorporadoras/01-abertura',
    diferencas: { ignorar: ['.ab-foto figcaption'] },
  },
  { id: 'convivencia', arquivo: 'incorporadoras/02-convivencia' },
  { id: 'percurso', arquivo: 'incorporadoras/03-percurso' },
  { id: 'ganhos', arquivo: 'incorporadoras/04-ganhos' },
  { id: 'instalacao', arquivo: 'incorporadoras/05-instalacao' },
  {
    id: 'lancamento',
    arquivo: 'incorporadoras/06-lancamento',
    diferencas: { ignorar: ['.ln-parceiras'] },
  },
  {
    id: 'proposta',
    arquivo: '08-proposta',
    diferencas: { ignorar: FORMULARIO, comClasses: ['proposta-metades'] },
  },
]

describe('Incorporadoras na prévia', () => {
  it('em produção responde 404, nunca é indexada e o <head> é o de hoje', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
    expect(metadata.title).toBe(metadadosInstitucionais('incorporadoras').title)
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => Pagina()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('reproduz as seções do protótipo, na ordem, com as cenas certas', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    conferirPagina(<Pagina />, {
      dataPagina: 'incorporadoras',
      secoes: SECOES,
      cenas: CENAS_INCORPORADORAS,
    })
  })

  it('foto sem legenda, sem faixa de construtoras e o pedido chega com Construtora marcado', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    window.history.replaceState(null, '', '/')
    const container = conferirPagina(<Pagina />, { dataPagina: 'incorporadoras', secoes: SECOES })
    expect(container.querySelector('#incorporadoras .ab-foto img')?.getAttribute('src')).toBe(
      '/site-v2/fotos/incorporadoras-obra.webp',
    )
    expect(container.querySelector('#incorporadoras .ab-foto figcaption')).toBeNull()
    expect(container.textContent).not.toMatch(/Imagem ilustrativa|Construtoras parceiras/)
    expect(
      container.querySelector<HTMLInputElement>(
        '#proposta input[name="perfil"][value="construtora"]',
      )?.checked,
    ).toBe(true)
  })
})
