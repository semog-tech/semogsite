import { describe, expect, it, vi } from 'vitest'
import { generateMetadata } from '@/app/(frontend)/[[...slug]]/page'
import { VIRADA_1_FEITA } from '@/site/inventario'
import { PREFIXO_DA_LEITURA } from '@/site/leitura/rotas'
import {
  caminhoNoSite,
  PAGINAS_NA_PREVIA,
  PREFIXO_DA_PREVIA,
  semPrefixoDaPrevia,
} from '@/site/rotas'
import {
  jsonLdInstitucional,
  META_DA_TECNOLOGIA,
  metadadosInstitucionais,
  type PaginaInstitucional,
  TITULO_DO_CONTATO,
} from '@/site/seo/institucional'
import { tituloDoOg } from '@/site/seo/og'
import { rotasDoApp } from './helpers/rotas-app'

// O catch-all importa todos os blocos do site atual, que chegam a módulos com `server-only` (lança
// no jsdom do Vitest); generateMetadata não usa nenhum (mesma neutralização de site-v2-og).
vi.mock('server-only', () => ({}))
vi.mock('@/blocks/RenderBlocks', () => ({ RenderBlocks: () => null }))

describe('caminhoNoSite: a prévia navega dentro dela (DP3)', () => {
  it('antes da virada, página que existe na prévia ganha o prefixo; as outras vão à URL real', () => {
    expect(VIRADA_1_FEITA).toBe(false)
    expect(PREFIXO_DA_PREVIA).toBe('/previa-v2')
    expect(PREFIXO_DA_LEITURA).toBe(PREFIXO_DA_PREVIA)
    expect(caminhoNoSite('/blog')).toBe('/previa-v2/blog')
    expect(caminhoNoSite('/blog/g20-superlogica-next-2026')).toBe(
      '/previa-v2/blog/g20-superlogica-next-2026',
    )
    expect(caminhoNoSite('/administradora-de-condominios-recife')).toBe(
      '/administradora-de-condominios-recife',
    )
    expect(caminhoNoSite('#proposta')).toBe('#proposta')
    expect(caminhoNoSite('https://semog.superlogica.net/x')).toBe('https://semog.superlogica.net/x')
  })

  it('hash e query ficam no lugar', () => {
    expect(caminhoNoSite('/privacidade#cookies')).toBe('/previa-v2/privacidade#cookies')
    expect(caminhoNoSite('/blog?categoria=financas')).toBe('/previa-v2/blog?categoria=financas')
  })

  it('semPrefixoDaPrevia devolve a URL real', () => {
    expect(semPrefixoDaPrevia('/previa-v2')).toBe('/')
    expect(semPrefixoDaPrevia('/previa-v2#unidades')).toBe('/#unidades')
    expect(semPrefixoDaPrevia('/previa-v2/semog')).toBe('/semog')
    expect(semPrefixoDaPrevia('/semog')).toBe('/semog')
  })

  it('toda página listada na prévia tem a rota dela em src/app/(site)', () => {
    const rotas = rotasDoApp()
      .filter((r) => r.arquivo === 'page')
      .map((r) => `/${r.segmentos.join('/')}`)
    for (const caminho of PAGINAS_NA_PREVIA) {
      const naPrevia = caminho === '/' ? '/previa-v2' : `/previa-v2${caminho}`
      expect(rotas, caminho).toContain(naPrevia)
    }
  })
})

describe('metadados das páginas institucionais', () => {
  const EXISTENTES: PaginaInstitucional[] = [
    'home',
    'semog',
    'administracao-de-condominios',
    'garante',
    'incorporadoras',
    'solucoes',
    'proposta',
  ]

  it.each(EXISTENTES)('%s: o mesmo <head> que o site no ar monta hoje (spec 6)', async (pagina) => {
    const slug = pagina === 'home' ? undefined : [pagina]
    const noAr = await generateMetadata({ params: Promise.resolve({ slug }) })
    expect(metadadosInstitucionais(pagina)).toEqual(noAr)
  })

  it('contato: o <head> de hoje, menos o título, que não promete WhatsApp (decisão de 16/10/2026)', async () => {
    const noAr = await generateMetadata({ params: Promise.resolve({ slug: ['contato'] }) })
    const meta = metadadosInstitucionais('contato')
    expect(meta.title).toBe(TITULO_DO_CONTATO)
    expect(String(meta.title)).not.toMatch(/whatsapp/i)
    expect(meta.description).toBe(noAr.description)
    expect(meta.alternates).toEqual(noAr.alternates)
    expect(meta.robots).toEqual(noAr.robots)
  })

  it('tecnologia, URL nova: título e descrição do protótipo, canonical próprio, card OG com título', () => {
    const meta = metadadosInstitucionais('tecnologia')
    expect(meta.title).toBe(META_DA_TECNOLOGIA.title)
    expect(meta.description).toBe(META_DA_TECNOLOGIA.description)
    expect(meta.alternates?.canonical).toBe('https://www.semog.com.br/tecnologia')
    expect(tituloDoOg('/tecnologia')).toBe(META_DA_TECNOLOGIA.title)
  })

  it('JSON-LD: Organization na home, BreadcrumbList nas demais', () => {
    expect(JSON.stringify(jsonLdInstitucional('home'))).toContain('"Organization"')
    expect(JSON.stringify(jsonLdInstitucional('tecnologia'))).toContain('"BreadcrumbList"')
    expect(JSON.stringify(jsonLdInstitucional('tecnologia'))).toContain('Tecnologia')
  })
})
