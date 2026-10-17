import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render } from '@testing-library/react'
import { isValidElement, type ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PaginaPostPrevia, {
  dynamicParams,
  generateMetadata as metadadosPostPrevia,
  generateStaticParams as postsDaPrevia,
} from '@/app/(site)/(leitura)/previa-v2/blog/[slug]/page'
import PaginaBlogPrevia, {
  metadata as metadadosBlogPrevia,
} from '@/app/(site)/(leitura)/previa-v2/blog/page'
import PaginaPrivacidadePrevia, {
  metadata as metadadosPrivacidadePrevia,
} from '@/app/(site)/(leitura)/previa-v2/privacidade/page'
import PaginaTermosPrevia, {
  metadata as metadadosTermosPrevia,
} from '@/app/(site)/(leitura)/previa-v2/termos/page'
import { getAllPosts } from '@/lib/blog'
import { absoluteUrl, getPageJsonLd, getPostJsonLd } from '@/lib/seo'
import { ConsentProvider } from '@/providers/ConsentProvider'
import { entradaDe } from '@/site/inventario'
import { paginaDoConteudo } from '@/site/leitura/metadados'
import { semPrefixoDaLeitura } from '@/site/leitura/rotas'
import { PaginaDoBlog, PaginaDoDocumento, PaginaDoPost } from '@/site/paginas/leitura'
import { listarArquivos, procurarTermosVedados } from './helpers/identidade'

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

function renderizar(no: ReactElement) {
  return render(<ConsentProvider>{no}</ConsentProvider>)
}

function jsonLd(): unknown {
  return JSON.parse(
    document.querySelector('script[type="application/ld+json"]')?.textContent ?? 'null',
  )
}

/**
 * Todo link interno do main cai numa página do inventário (os da prévia, pela URL real).
 * Privacidade e Termos não têm link interno no main hoje (só e-mail e #cookies): `minimo` 0.
 */
function conferirLinks(minimo: number) {
  const hrefs = Array.from(
    document.querySelectorAll('main a[href^="/"]'),
    (a) => a.getAttribute('href') ?? '',
  )
  expect(hrefs.length).toBeGreaterThanOrEqual(minimo)
  for (const href of hrefs) {
    expect(entradaDe(semPrefixoDaLeitura(href).split('#')[0] || '/')?.tipo, href).toBe('pagina')
  }
}

/** Ids únicos no main e todo link do índice com alvo. */
function conferirIds() {
  const ids = Array.from(document.querySelectorAll('main [id]'), (elemento) => elemento.id)
  expect(new Set(ids).size).toBe(ids.length)
  for (const link of document.querySelectorAll('[data-indice] a')) {
    const alvo = (link.getAttribute('href') ?? '').slice(1)
    expect(document.getElementById(alvo), alvo).not.toBeNull()
  }
}

function conferirComum({ minimoDeLinks = 1 }: { minimoDeLinks?: number } = {}) {
  expect(document.querySelector('[data-cabecalho]')).not.toBeNull()
  expect(document.querySelector('footer[data-tema="marinho"]')).not.toBeNull()
  expect(document.querySelector('section#proposta form')).not.toBeNull()
  // Fase 4 (spec 5, DP6): o único WhatsApp é o do "Sou cliente", e todo ele é atendimento.
  for (const link of document.querySelectorAll('a[href*="wa.me"]')) {
    expect(link.getAttribute('data-wa-caminho'), link.getAttribute('href') ?? '').toMatch(
      /^(cliente|restrita)$/,
    )
    expect(link.closest('dialog.sou-cliente'), link.getAttribute('href') ?? '').not.toBeNull()
  }
  expect(procurarTermosVedados(document.body.textContent ?? '')).toEqual([])
  conferirLinks(minimoDeLinks)
  conferirIds()
}

describe('índice do blog', () => {
  it('12 posts, o mais recente em destaque com foto, filtros e o JSON-LD do /blog atual', () => {
    renderizar(PaginaDoBlog())
    expect(document.querySelector('main')?.getAttribute('data-pagina')).toBe('blog')
    expect(document.querySelectorAll('.bi-item')).toHaveLength(12)
    const [maisRecente] = getAllPosts()
    expect(document.querySelector('.bi-item--destaque a')?.getAttribute('href')).toBe(
      `/previa-v2/blog/${maisRecente?.slug}`,
    )
    expect(document.querySelector('.bi-item--destaque img')).not.toBeNull()
    expect(document.querySelector('.bi-filtro--todos')?.textContent).toBe('Todos 12')
    expect(
      document.querySelectorAll('[aria-current="page"][data-pagina-link="blog"]').length,
    ).toBeGreaterThan(0)
    expect(jsonLd()).toEqual(getPageJsonLd({ page: paginaDoConteudo('blog'), path: 'blog' }))
    conferirComum()
  })
})

describe('posts', () => {
  it('os 12: título, índice com alvo, "Em resumo", Leia também e o BlogPosting de hoje', async () => {
    for (const post of getAllPosts()) {
      const { unmount } = renderizar(await PaginaDoPost({ slug: post.slug }))
      expect(document.querySelector('h1')?.textContent, post.slug).toBe(post.title)
      expect(document.querySelector('[data-corpo-leitura] p'), post.slug).not.toBeNull()
      expect(document.querySelectorAll('.artigo-resumo li'), post.slug).toHaveLength(
        post.keyTakeaways?.length ?? 0,
      )
      const leiaTambem = Array.from(
        document.querySelectorAll('#leia-tambem a.link-seta, #leia-tambem h3 a'),
        (a) => a.getAttribute('href'),
      )
      expect(leiaTambem, post.slug).toHaveLength(3)
      expect(leiaTambem, post.slug).not.toContain(`/previa-v2/blog/${post.slug}`)
      expect(jsonLd(), post.slug).toEqual(getPostJsonLd(post))
      conferirComum()
      unmount()
    }
  })

  it('o post com dois títulos fica sem índice; o do G20 traz as duas fotos e o vídeo', async () => {
    const curto = renderizar(await PaginaDoPost({ slug: 'cinco-sinais-trocar-administradora' }))
    expect(document.querySelector('nav[data-indice]')).toBeNull()
    curto.unmount()
    renderizar(await PaginaDoPost({ slug: 'g20-superlogica-next-2026' }))
    expect(document.querySelectorAll('.artigo-corpo figure.artigo-figura')).toHaveLength(3)
    expect(document.querySelector('.artigo-figura--vertical video')?.getAttribute('preload')).toBe(
      'none',
    )
  })

  it('slug desconhecido é 404', async () => {
    await expect(PaginaDoPost({ slug: 'nao-existe' })).rejects.toThrow(
      'NEXT_HTTP_ERROR_FALLBACK;404',
    )
  })
})

describe('documentos', () => {
  it('Privacidade: atualização, índice, o controle de cookies em #cookies e o JSON-LD de hoje', async () => {
    renderizar(await PaginaDoDocumento({ slug: 'privacidade' }))
    expect(document.querySelector('h1')?.textContent).toBe('Política de Privacidade')
    expect(document.querySelector('.artigo-meta')?.textContent).toContain('Última atualização')
    expect(document.querySelectorAll('#cookies [role="switch"]')).toHaveLength(3)
    expect(document.querySelector('a[href="#cookies"]')).not.toBeNull()
    expect(document.querySelector('.artigo-voltar')).toBeNull()
    expect(jsonLd()).toEqual(
      getPageJsonLd({ page: paginaDoConteudo('privacidade'), path: 'privacidade' }),
    )
    conferirComum({ minimoDeLinks: 0 })
  })

  it('Termos: sem controle de cookies', async () => {
    renderizar(await PaginaDoDocumento({ slug: 'termos' }))
    expect(document.querySelector('h1')?.textContent).toBe('Termos de Uso')
    expect(document.getElementById('cookies')).toBeNull()
    conferirComum({ minimoDeLinks: 0 })
  })
})

describe('rotas da prévia', () => {
  const params = { params: Promise.resolve({ slug: 'g20-superlogica-next-2026' }) }

  it('em produção, as quatro respondem 404', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => PaginaBlogPrevia()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
    await expect(PaginaPostPrevia(params)).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
    expect(() => PaginaPrivacidadePrevia()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
    expect(() => PaginaTermosPrevia()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('nunca indexadas, com o canonical da URL real', async () => {
    const pares = [
      [metadadosBlogPrevia, 'blog'],
      [metadadosPrivacidadePrevia, 'privacidade'],
      [metadadosTermosPrevia, 'termos'],
      [await metadadosPostPrevia(params), 'blog/g20-superlogica-next-2026'],
    ] as const
    for (const [metadados, caminho] of pares) {
      expect(metadados.robots, caminho).toEqual({ index: false, follow: false })
      expect(metadados.alternates?.canonical, caminho).toBe(absoluteUrl(caminho))
    }
  })

  it('a rota de post gera os 12 slugs e nada além', () => {
    expect(dynamicParams).toBe(false)
    expect(
      postsDaPrevia()
        .map((p) => p.slug)
        .sort(),
    ).toEqual(
      getAllPosts()
        .map((p) => p.slug)
        .sort(),
    )
  })

  it('fora de produção, cada rota entrega o corpo certo', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(isValidElement(PaginaBlogPrevia()) && PaginaBlogPrevia().type).toBe(PaginaDoBlog)
    const post = await PaginaPostPrevia(params)
    expect(isValidElement<{ slug: string }>(post) && post.props.slug).toBe(
      'g20-superlogica-next-2026',
    )
    const privacidade = PaginaPrivacidadePrevia()
    expect(isValidElement<{ slug: string }>(privacidade) && privacidade.props.slug).toBe(
      'privacidade',
    )
    expect(PaginaTermosPrevia().type).toBe(PaginaDoDocumento)
  })
})

describe('pacote leitura sem JS de cena (spec 3.1)', () => {
  it('nada da leitura importa Lenis, GSAP, runner, cenas ou a montagem do core', () => {
    const raiz = process.cwd()
    const arquivos = [
      ...listarArquivos(path.join(raiz, 'src', 'site', 'leitura'), ['.ts', '.tsx']),
      ...listarArquivos(path.join(raiz, 'src', 'site', 'secoes', 'leitura'), ['.ts', '.tsx']),
      ...listarArquivos(path.join(raiz, 'src', 'app', '(site)', '(leitura)'), ['.ts', '.tsx']),
      path.join(raiz, 'src', 'site', 'paginas', 'leitura.tsx'),
      path.join(raiz, 'src', 'site', 'layout', 'EsqueletoLeitura.tsx'),
    ]
    const proibido =
      /from\s+['"](?:lenis|gsap|@gsap\/react|@\/site\/runner\/[^'"]*|@\/site\/cenas\/[^'"]*|@\/site\/core\/montagem)['"]/
    const achados = arquivos.filter((arquivo) =>
      proibido.test(readFileSync(arquivo, 'utf8').replace(/\r\n?/g, '\n')),
    )
    expect(arquivos.length).toBeGreaterThanOrEqual(12)
    expect(achados).toEqual([])
  })

  it('o layout leitura importa o CSS comum e não o do Lenis', () => {
    const layout = readFileSync(
      path.join(process.cwd(), 'src', 'app', '(site)', '(leitura)', 'layout.tsx'),
      'utf8',
    )
    expect(layout).toContain("'@/site/secoes/leitura/leitura.css'")
    expect(layout).not.toContain('lenis')
  })
})
