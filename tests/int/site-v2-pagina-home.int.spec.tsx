import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Pagina, { metadata } from '@/app/(site)/(app)/previa-v2/page'
import { CENAS_HOME } from '@/site/cenas/paginas/home'
import { conteudo } from '@/site/conteudo/conteudo'
import { estaPendente } from '@/site/conteudo/pendencias'
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

const VIDEO_PENDENTE = estaPendente(conteudo.comunidade.experience.video26)
const NUMEROS_PENDENTES = estaPendente(conteudo.tecnologia.numerosDaPrestacao)

const SECOES: SecaoEsperada[] = [
  { id: 'abertura', arquivo: '01-abertura', diferencas: { ignorar: FORMULARIO } },
  { id: 'condominios', arquivo: '02-condominios' },
  { id: 'pilares', arquivo: '03-pilares' },
  {
    id: 'tecnologia',
    arquivo: '04-tecnologia',
    diferencas: NUMEROS_PENDENTES ? { comClasses: ['a-confirmar'] } : {},
  },
  { id: 'ranking', arquivo: '05-ranking' },
  { id: 'unidades', arquivo: '06-unidades' },
  {
    id: 'comunidade',
    arquivo: '07-comunidade',
    // Com o vídeo do 26 (Tarefa 4.5a), o primeiro retrato troca o <img> por <video> (DP12).
    diferencas: VIDEO_PENDENTE ? { comClasses: ['a-confirmar'] } : { contagemLivre: ['<img>'] },
  },
  {
    id: 'proposta',
    arquivo: '08-proposta',
    diferencas: { ignorar: FORMULARIO, comClasses: ['proposta-metades'] },
  },
]

describe('home do site v2 na prévia', () => {
  it('em produção responde 404 e nunca é indexada', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => Pagina()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('reproduz as seções do protótipo, na ordem, com as cenas certas', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    conferirPagina(<Pagina />, { dataPagina: 'home', secoes: SECOES, cenas: CENAS_HOME })
  })

  it('a abertura traz o pedido de proposta de verdade, e o h1 é o slogan', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const container = conferirPagina(<Pagina />, { dataPagina: 'home', secoes: SECOES })
    expect(
      container.querySelector('#abertura form.formulario-proposta.abertura-form'),
    ).not.toBeNull()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(
      container.querySelectorAll('#unidades a[href^="/administradora-de-condominios-"]'),
    ).toHaveLength(conteudo.unidades.length)
  })

  it('comunidade: sem edição nem data inventada, citação sem "síndica", e o vídeo do 26 no primeiro retrato', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const container = conferirPagina(<Pagina />, { dataPagina: 'home', secoes: SECOES })
    const comunidade = container.querySelector('#comunidade')?.textContent ?? ''
    expect(comunidade).not.toContain('5ª edição')
    expect(comunidade).not.toContain('Anunciada')
    expect(comunidade).toContain('Aguarde novas informações.')
    expect(comunidade).toContain('Ana Cláudia, sobre a 4ª edição')
    expect(comunidade).not.toContain('Ana Cláudia, síndica')
    if (VIDEO_PENDENTE) {
      expect(container.querySelector('#comunidade .comunidade-dupla .a-confirmar')).not.toBeNull()
    } else {
      expect(container.querySelector('#comunidade .comunidade-dupla video')).not.toBeNull()
    }
  })

  it('tecnologia: a prestação desde 2023 e os números da nova só com dado do Leandro', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const container = conferirPagina(<Pagina />, { dataPagina: 'home', secoes: SECOES })
    const contexto = container.querySelector('#tecnologia .tec-contexto')?.textContent ?? ''
    expect(contexto).toContain('Prestação de contas digital desde 2023.')
    expect(contexto).not.toMatch(/670|220/)
    if (NUMEROS_PENDENTES) expect(contexto).toContain('A CONFIRMAR')
  })
})
