import { afterEach, describe, expect, it, vi } from 'vitest'
import Pagina, { metadata } from '@/app/(site)/(app)/previa-v2/semog/page'
import { CENAS_SEMOG } from '@/site/cenas/paginas/semog'
import { conteudo } from '@/site/conteudo/conteudo'
import { estaPendente } from '@/site/conteudo/pendencias'
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
const FOTO_PENDENTE = estaPendente(conteudo.aSemog.pessoas.fotoDosSocios)

const SECOES: SecaoEsperada[] = [
  { id: 'a-semog', arquivo: 'semog/01-manifesto' },
  { id: 'historia', arquivo: 'semog/02-historia' },
  { id: 'principios', arquivo: 'semog/03-principios' },
  {
    id: 'pessoas',
    arquivo: 'semog/04-pessoas',
    diferencas: FOTO_PENDENTE
      ? { semClasses: ['ps-aenviar-tema'], comClasses: ['a-confirmar'] }
      : {
          semClasses: ['ps-aenviar', 'ps-aenviar-rotulo', 'ps-aenviar-tema'],
          // Com a foto, o rótulo "Foto real a enviar" (<p>) sai e a moldura ganha o <img>.
          contagemLivre: ['<p>', '<img>'],
        },
  },
  { id: 'depoimentos', arquivo: 'semog/06-depoimentos' },
  { id: 'assembleia', arquivo: 'semog/05-assembleia' },
  {
    id: 'proposta',
    arquivo: '08-proposta',
    diferencas: { ignorar: FORMULARIO, comClasses: ['proposta-metades'] },
  },
]

describe('A Semog na prévia', () => {
  it('em produção responde 404, nunca é indexada e o <head> é o de hoje', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
    expect(metadata.title).toBe(metadadosInstitucionais('semog').title)
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => Pagina()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('reproduz as seções do protótipo, na ordem, com as cenas certas', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    conferirPagina(<Pagina />, { dataPagina: 'semog', secoes: SECOES, cenas: CENAS_SEMOG })
  })

  it('a linha do tempo diz o que o Garante faz e a moldura dos sócios não promete foto', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const container = conferirPagina(<Pagina />, { dataPagina: 'semog', secoes: SECOES })
    const historia = container.querySelector('#historia')?.textContent ?? ''
    expect(historia).toContain('garante ao condomínio 100% da arrecadação prevista')
    const pessoas = container.querySelector('#pessoas')?.textContent ?? ''
    expect(pessoas).not.toContain('Foto real a enviar')
    expect(pessoas).toContain('Acesso fácil aos sócios')
    expect(container.querySelector('[aria-current="page"]')?.getAttribute('href')).toBe(
      '/previa-v2/semog',
    )
  })
})
