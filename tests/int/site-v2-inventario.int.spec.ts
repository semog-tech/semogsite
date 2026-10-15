import { describe, expect, it } from 'vitest'
import { pages } from '@/../content/pages'
import { CITY_LANDINGS } from '@/data/cityLandings'
import { getAllPosts } from '@/lib/blog'
import { conteudo } from '@/site/conteudo/conteudo'
import { entradaDe, INVENTARIO } from '@/site/inventario'
import { REDIRECIONAMENTOS } from '@/site/redirecionamentos'
import { textosDe } from './helpers/identidade'

/** As URLs que o site no ar serve hoje (fora dos grupos intocados). */
const ATUAIS = [
  ...Object.keys(pages).map((slug) => (slug === 'home' ? '/' : `/${slug}`)),
  ...Object.values(CITY_LANDINGS).map((cidade) => `/${cidade.slug}`),
  ...getAllPosts().map((post) => `/blog/${post.slug}`),
  '/experience',
  '/styleguide',
]
const SLUGS_DE_POST = new Set(getAllPosts().map((post) => post.slug))
/** Redirects de caminho fixo: sem condição de host e sem parâmetro (`:slug`). */
const FIXOS = REDIRECIONAMENTOS.filter((r) => !r.has && !r.source.includes(':'))

describe('inventário de URLs do site v2', () => {
  it('toda URL servida hoje tem destino declarado (nada some em silêncio)', () => {
    const semDestino = ATUAIS.filter((url) => entradaDe(url) === undefined)
    expect(semDestino).toEqual([])
    expect(ATUAIS.length).toBeGreaterThanOrEqual(30)
  })

  it('a decisão de 15/10: /solucoes é mantida e as outras duas URLs redirecionam para /tecnologia', () => {
    expect(entradaDe('/solucoes')).toEqual({ tipo: 'pagina', pacote: 'app', fase: 4 })
    expect(entradaDe('/prestacao-de-contas-condominio')).toEqual({
      tipo: 'redireciona',
      destino: '/tecnologia',
      fase: 4,
    })
    expect(entradaDe('/software-de-gestao-condominial')).toEqual({
      tipo: 'redireciona',
      destino: '/tecnologia',
      fase: 4,
    })
  })

  it('todo redirect do inventário cai numa página do inventário', () => {
    for (const [origem, entrada] of Object.entries(INVENTARIO)) {
      if (entrada.tipo !== 'redireciona') continue
      expect(entradaDe(entrada.destino)?.tipo, origem).toBe('pagina')
    }
  })

  it('os grupos intocados e a prévia estão declarados como tais', () => {
    for (const url of ['/experience', '/qr/folder', '/desfecho/abc', '/api/track/whatsapp']) {
      expect(entradaDe(url), url).toEqual({ tipo: 'intocada' })
    }
    expect(entradaDe('/previa-v2')).toEqual({ tipo: 'previa' })
  })

  it('todo link interno do conteúdo aponta para uma página do inventário', () => {
    const links = textosDe(conteudo).filter((t) => t.startsWith('/') && !t.startsWith('/site-v2/'))
    expect(links.length).toBeGreaterThan(0)
    for (const link of links)
      expect(entradaDe(link.split('#')[0] || '/')?.tipo, link).toBe('pagina')
  })
})

describe('redirects do site (movidos do next.config.ts)', () => {
  it('os 54 continuam todos lá', () => {
    expect(REDIRECIONAMENTOS).toHaveLength(54)
    expect(REDIRECIONAMENTOS[0]).toMatchObject({
      source: '/:path*',
      destination: 'https://www.semog.com.br/:path*',
      permanent: true,
    })
    expect(REDIRECIONAMENTOS.every((r) => r.permanent === true)).toBe(true)
  })

  it('nenhuma página do inventário é origem de redirect', () => {
    expect(
      FIXOS.filter((r) => entradaDe(r.source)?.tipo === 'pagina').map((r) => r.source),
    ).toEqual([])
  })

  it('todo destino de redirect existe e é página ou rota intocada (post do blog incluído)', () => {
    for (const r of FIXOS) {
      const entrada = entradaDe(r.destination)
      expect(['pagina', 'intocada'], `${r.source} → ${r.destination}`).toContain(entrada?.tipo)
      if (r.destination.startsWith('/blog/')) {
        expect(SLUGS_DE_POST.has(r.destination.slice('/blog/'.length)), r.destination).toBe(true)
      }
    }
  })

  it('não há cadeia hoje', () => {
    const origens = new Set(FIXOS.map((r) => r.source))
    expect(FIXOS.filter((r) => origens.has(r.destination)).map((r) => r.source)).toEqual([])
  })

  // Com /solucoes mantida como página, `/solucoes.html` e `/domestica` (que apontam para ela)
  // não formam cadeia com nenhum redirect planejado: o teste acima já cobre.
})
