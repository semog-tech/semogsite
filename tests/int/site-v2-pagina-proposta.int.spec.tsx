import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Pagina, { metadata } from '@/app/(site)/(landing)/previa-v2/proposta/page'
import { conteudo } from '@/site/conteudo/conteudo'
import { metadadosInstitucionais } from '@/site/seo/institucional'
import { conferirPagina, type SecaoEsperada } from './helpers/paginas'

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
  {
    id: 'proposta',
    arquivo: 'proposta/01-pedido',
    diferencas: { ignorar: ['form', '.fp-moldura'] },
  },
  { id: 'proposta-depois', arquivo: 'proposta/02-depois' },
]

describe('página de proposta (pacote landing) na prévia', () => {
  it('em produção responde 404, nunca é indexada e o <head> é o de hoje', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
    expect(metadata.title).toBe(metadadosInstitucionais('proposta').title)
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => Pagina()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('reproduz as seções do protótipo, com o pedido de verdade na dobra', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const container = conferirPagina(<Pagina />, { dataPagina: 'proposta', secoes: SECOES })
    expect(container.querySelector('#proposta.pp form.formulario-proposta.pp-form')).not.toBeNull()
    expect(container.querySelector('.proposta-metades')).toBeNull()
    // A página usa o título do protótipo; os outros formulários mantêm "Peça uma proposta".
    // O id do formulário não repete o do h1 (antes, os dois eram #pp-titulo).
    const form = container.querySelector('form.pp-form')
    const rotulo = form?.getAttribute('aria-labelledby') ?? ''
    expect(container.querySelectorAll(`#${rotulo}`)).toHaveLength(1)
    expect(container.querySelector(`#${rotulo}`)?.textContent).toBe('Conte sobre o seu condomínio')
    expect(container.querySelectorAll('#pp-titulo')).toHaveLength(1)
    expect(container.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      `${conteudo.propostaPagina.titulo} ${conteudo.propostaPagina.enfase}`,
    )
    expect(container.querySelector('a[href="#proposta"]') ?? null).not.toBeNull()
  })

  it('o pacote landing não carrega Lenis nem runner de cenas', () => {
    const raiz = path.join(process.cwd(), 'src', 'site')
    for (const arquivo of [
      'layout/EsqueletoLanding.tsx',
      'landing/ligar-landing.ts',
      'landing/LigarLanding.tsx',
      'paginas/proposta.tsx',
    ]) {
      const fonte = readFileSync(path.join(raiz, arquivo), 'utf8')
      expect(fonte, arquivo).not.toMatch(
        /from 'lenis'|@\/site\/runner|@\/site\/cenas|core\/montagem/,
      )
    }
    const css = readFileSync(path.join(raiz, 'secoes', 'landing', 'landing.css'), 'utf8')
    expect(css).not.toMatch(/^html\s*\{/m)
  })
})
