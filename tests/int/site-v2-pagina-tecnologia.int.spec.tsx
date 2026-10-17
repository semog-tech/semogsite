import { afterEach, describe, expect, it, vi } from 'vitest'
import Pagina, { metadata } from '@/app/(site)/(app)/previa-v2/tecnologia/page'
import { CENAS_TECNOLOGIA } from '@/site/cenas/paginas/tecnologia'
import { conteudo } from '@/site/conteudo/conteudo'
import { estaPendente } from '@/site/conteudo/pendencias'
import { META_DA_TECNOLOGIA } from '@/site/seo/institucional'
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
const PENDENTES = estaPendente(conteudo.tecnologia.numerosDaPrestacao)

// O apoio do "Dia 1" (o boleto inteligente, com o selo) sai inteiro por resposta do Leandro: a
// subárvore sai dos dois lados, e o resto do mês continua conferido. Com os números da nova
// prestação pendentes, o selo deles entra no apoio do fim do mês (classe a mais).
const SECOES: SecaoEsperada[] = [
  {
    id: 'semog-one',
    arquivo: 'tecnologia/01-abertura',
    diferencas: PENDENTES
      ? { semDados: ['data-conta', 'data-prefixo'], comClasses: ['a-confirmar'] }
      : {},
  },
  {
    id: 'mes',
    arquivo: 'tecnologia/02-mes',
    diferencas: {
      ignorar: ['.ms-momento:nth-child(2) .ms-apoio'],
      ...(PENDENTES ? { comClasses: ['a-confirmar'] } : {}),
    },
  },
  { id: 'evolucao', arquivo: 'tecnologia/03-evolucao' },
  { id: 'conferencia', arquivo: 'tecnologia/04-conferencia' },
  {
    id: 'proposta',
    arquivo: '08-proposta',
    diferencas: { ignorar: FORMULARIO, comClasses: ['proposta-metades'] },
  },
]

describe('Tecnologia (URL nova) na prévia', () => {
  it('em produção responde 404, nunca é indexada e tem o <head> do protótipo', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
    expect(metadata.title).toBe(META_DA_TECNOLOGIA.title)
    expect(metadata.alternates?.canonical).toBe('https://www.semog.com.br/tecnologia')
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => Pagina()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('reproduz as seções do protótipo, na ordem, com as cenas certas', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    conferirPagina(<Pagina />, {
      dataPagina: 'tecnologia',
      secoes: SECOES,
      cenas: CENAS_TECNOLOGIA,
    })
  })

  it('sem número inventado: 670 e 220 sumiram, e o boleto inteligente também', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const container = conferirPagina(<Pagina />, { dataPagina: 'tecnologia', secoes: SECOES })
    const texto = container.textContent ?? ''
    expect(texto).not.toMatch(/\b670\b|\b220\b/)
    expect(texto).not.toMatch(/Boleto inteligente/i)
    expect(texto).toContain('Prestação de contas digital desde 2023.')
    expect(container.querySelectorAll('#mes .ms-momento:nth-child(2) .ms-apoio')).toHaveLength(0)
    if (PENDENTES) {
      expect(container.querySelectorAll('#semog-one .so-numero .a-confirmar')).toHaveLength(2)
      expect(container.querySelector('#semog-one [data-conta]')).toBeNull()
      expect(container.querySelectorAll('#mes .ms-momento:last-child .a-confirmar')).toHaveLength(1)
    }
  })
})
