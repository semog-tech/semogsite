import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { pages } from '@/../content/pages'
import { CITY_LANDINGS } from '@/data/cityLandings'
import { getAllPosts } from '@/lib/blog'
import { conteudo } from '@/site/conteudo/conteudo'
import { entradaDe, INVENTARIO, servidaComoPagina, VIRADA_1_FEITA } from '@/site/inventario'
import { REDIRECIONAMENTOS } from '@/site/redirecionamentos'
import { textosDe } from './helpers/identidade'

/**
 * Rotas técnicas e o arquivo do App Router que serve cada uma (um OG dinâmico de cada tipo,
 * como amostra). Se o arquivo mudar de lugar, este mapa muda junto: é o que prova que a rota
 * continua existindo.
 */
const ARQUIVOS_TECNICOS: Readonly<Record<string, string>> = {
  '/sitemap.xml': 'src/app/(frontend)/sitemap.ts',
  '/robots.txt': 'src/app/robots.ts',
  '/icon.svg': 'src/app/icon.svg',
  '/apple-icon.png': 'src/app/apple-icon.png',
  '/opengraph-image': 'src/app/opengraph-image.tsx',
  '/semog/opengraph-image': 'src/app/[slug]/opengraph-image.tsx',
  '/blog/g20-superlogica-next-2026/opengraph-image': 'src/app/blog/[slug]/opengraph-image.tsx',
}

/** As URLs que o site no ar serve hoje (fora dos grupos intocados). */
const ATUAIS = [
  ...Object.keys(pages).map((slug) => (slug === 'home' ? '/' : `/${slug}`)),
  ...Object.values(CITY_LANDINGS).map((cidade) => `/${cidade.slug}`),
  ...getAllPosts().map((post) => `/blog/${post.slug}`),
  '/experience',
  '/styleguide',
  ...Object.keys(ARQUIVOS_TECNICOS),
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

describe('rotas técnicas e o que está no ar (fase 3)', () => {
  it('toda rota técnica do inventário tem o arquivo que a serve e fica fora das páginas', () => {
    const tecnicas = Object.entries(INVENTARIO)
      .filter(([, entrada]) => entrada.tipo === 'tecnica')
      .map(([caminho]) => caminho)
    expect(tecnicas.sort()).toEqual([
      '/apple-icon.png',
      '/icon.svg',
      '/opengraph-image',
      '/robots.txt',
      '/sitemap.xml',
    ])
    for (const [url, arquivo] of Object.entries(ARQUIVOS_TECNICOS)) {
      expect(entradaDe(url), url).toEqual({ tipo: 'tecnica' })
      expect(existsSync(path.join(process.cwd(), arquivo)), arquivo).toBe(true)
    }
  })

  it('o OG dinâmico vale só para um segmento ou um post', () => {
    expect(entradaDe('/a/b/opengraph-image')).toBeUndefined()
    expect(entradaDe('/blog/x/y/opengraph-image')).toBeUndefined()
  })

  it('as páginas de leitura da prévia são prévia, não página', () => {
    expect(entradaDe('/previa-v2/blog')).toEqual({ tipo: 'previa' })
    expect(entradaDe('/previa-v2/blog/g20-superlogica-next-2026')).toEqual({ tipo: 'previa' })
    expect(entradaDe('/previa-v2/privacidade')).toEqual({ tipo: 'previa' })
    expect(entradaDe('/previa-v2-outra')).toBeUndefined()
  })

  it('antes da virada 1, o que responde como página é o site atual', () => {
    expect(VIRADA_1_FEITA).toBe(false)
    expect(servidaComoPagina(entradaDe('/semog'))).toBe(true)
    expect(servidaComoPagina(entradaDe('/blog/g20-superlogica-next-2026'))).toBe(true)
    expect(servidaComoPagina(entradaDe('/tecnologia'))).toBe(false)
    expect(servidaComoPagina(entradaDe('/prestacao-de-contas-condominio'))).toBe(true)
    expect(servidaComoPagina(entradaDe('/software-de-gestao-condominial'))).toBe(true)
    for (const url of ['/styleguide', '/previa-v2', '/sitemap.xml', '/experience', '/nao-existe']) {
      expect(servidaComoPagina(entradaDe(url)), url).toBe(false)
    }
  })

  it('depois da virada 1, /tecnologia nasce e as duas URLs da fase 4 passam a redirecionar', () => {
    expect(servidaComoPagina(entradaDe('/tecnologia'), true)).toBe(true)
    expect(servidaComoPagina(entradaDe('/prestacao-de-contas-condominio'), true)).toBe(false)
    expect(servidaComoPagina(entradaDe('/software-de-gestao-condominial'), true)).toBe(false)
    expect(servidaComoPagina(entradaDe('/semog'), true)).toBe(true)
  })

  it('todo redirect do inventário é da fase 4, que entra com a virada 1 (premissa de servidaComoPagina)', () => {
    const fases = Object.values(INVENTARIO).flatMap((entrada) =>
      entrada.tipo === 'redireciona' ? [entrada.fase] : [],
    )
    expect(fases.length).toBeGreaterThan(0)
    expect(fases.every((fase) => fase === 4)).toBe(true)
  })
})
