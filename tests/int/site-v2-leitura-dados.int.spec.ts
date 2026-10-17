import { describe, expect, it, vi } from 'vitest'
import { getLegalPage } from '@/../content/lib/legal'
import { generateMetadata as metadadosAntigosDaPagina } from '@/app/(frontend)/[[...slug]]/page'
import { generateMetadata as metadadosAntigosDoPost } from '@/app/(frontend)/blog/[slug]/page'
import { findPostBySlug, getAllPosts, type PostData } from '@/lib/blog'
import { VIRADA_1_FEITA } from '@/site/inventario'
import {
  cartaoDoPost,
  dataPorExtenso,
  filtrosDasCategorias,
  IDS_DA_PAGINA,
  idDoTitulo,
  indiceDoTexto,
  minutosDeLeitura,
  regrasDoFiltro,
} from '@/site/leitura/dados'
import { metadadosDaPagina, metadadosDoPost } from '@/site/leitura/metadados'
import { caminhoDeLeitura, PREFIXO_DA_LEITURA, semPrefixoDaLeitura } from '@/site/leitura/rotas'
import { ROBOTS_DA_PREVIA } from '@/site/previa'

// O catch-all importa todos os blocos do site atual; generateMetadata não usa nenhum.
vi.mock('@/blocks/RenderBlocks', () => ({ RenderBlocks: () => null }))

describe('rotas da leitura', () => {
  it('enquanto a virada 1 não acontece, a leitura vive sob /previa-v2', () => {
    expect(PREFIXO_DA_LEITURA).toBe(VIRADA_1_FEITA ? '' : '/previa-v2')
    expect(caminhoDeLeitura('/blog')).toBe('/previa-v2/blog')
    expect(caminhoDeLeitura('/blog/g20-superlogica-next-2026')).toBe(
      '/previa-v2/blog/g20-superlogica-next-2026',
    )
  })

  it('semPrefixoDaLeitura devolve a URL real e não mexe no resto', () => {
    expect(semPrefixoDaLeitura('/previa-v2/blog/x')).toBe('/blog/x')
    expect(semPrefixoDaLeitura('/previa-v2/termos')).toBe('/termos')
    expect(semPrefixoDaLeitura('/garante')).toBe('/garante')
    expect(semPrefixoDaLeitura('/previa-v2')).toBe('/previa-v2')
  })

  it('a prévia nunca é indexada', () => {
    expect(ROBOTS_DA_PREVIA).toEqual({ index: false, follow: false })
  })
})

describe('dados da leitura', () => {
  it('data por extenso, no fuso do Recife', () => {
    expect(dataPorExtenso('2026-08-27T09:00:00.000Z')).toBe('27 de agosto de 2026')
    // 02:00 UTC de 1º de julho ainda é 30 de junho no Recife (UTC-3).
    expect(dataPorExtenso('2026-07-01T02:00:00.000Z')).toBe('30 de junho de 2026')
  })

  it('minutos: os do frontmatter; sem eles, 200 palavras por minuto e nunca menos de 1', () => {
    expect(minutosDeLeitura({ readingTime: 9, body: 'curto' })).toBe(9)
    expect(minutosDeLeitura({ readingTime: undefined, body: 'palavra '.repeat(600) })).toBe(3)
    expect(minutosDeLeitura({ readingTime: undefined, body: 'uma' })).toBe(1)
  })

  it('cartão: link da prévia, categoria resolvida, resumo, data e minutos', () => {
    const post = findPostBySlug('g20-superlogica-next-2026')
    if (!post) throw new Error('post do G20 ausente')
    expect(cartaoDoPost(post)).toEqual({
      slug: 'g20-superlogica-next-2026',
      href: '/previa-v2/blog/g20-superlogica-next-2026',
      titulo: post.title,
      resumo: post.excerpt,
      categoria: { slug: 'a-semog', titulo: 'A Semog' },
      dataTexto: '27 de agosto de 2026',
      minutos: 6,
    })
  })

  it('post com categoria desconhecida derruba o build em vez de inventar rótulo', () => {
    const base = findPostBySlug('g20-superlogica-next-2026')
    if (!base) throw new Error('post do G20 ausente')
    const quebrado: PostData = { ...base, category: 'sumiu', categoryTitle: null }
    expect(() => cartaoDoPost(quebrado)).toThrow('categoria desconhecida')
  })

  it('filtros: só categorias com post, na ordem de categories.ts, com a contagem', () => {
    const filtros = filtrosDasCategorias(getAllPosts())
    expect(filtros.find((f) => f.slug === 'financas')?.total).toBe(3)
    expect(filtros.reduce((soma, f) => soma + f.total, 0)).toBe(getAllPosts().length)
    expect(filtros.every((f) => f.total > 0 && /^[a-z0-9-]+$/.test(f.slug))).toBe(true)
    expect(filtros[0]?.slug).toBe('financas')
  })

  it('regras do filtro: um par por categoria, por token de cor', () => {
    const regras = regrasDoFiltro([{ slug: 'financas' }])
    expect(regras).toContain('#blog-indice:has(#categoria-financas:target)')
    expect(regras).toContain('.bi-item:not([data-categoria="financas"]) { display: none; }')
    expect(regras).toContain('background: var(--marinho)')
    expect(regras.split('\n')).toHaveLength(2)
  })

  it('id do título: sem acento, minúsculo, hífen no lugar do resto', () => {
    expect(idDoTitulo('E quanto a Semog cobra?')).toBe('e-quanto-a-semog-cobra')
    expect(idDoTitulo('1. Dados que coletamos')).toBe('1-dados-que-coletamos')
    expect(idDoTitulo('Híbrida: o melhor dos dois mundos')).toBe('hibrida-o-melhor-dos-dois-mundos')
  })

  it('índice: só os ## do texto, na ordem, também com CRLF', () => {
    expect(indiceDoTexto('## Um\r\n\r\nTexto\r\n### Sub\r\n## Dois\r\n')).toEqual([
      { id: 'um', texto: 'Um' },
      { id: 'dois', texto: 'Dois' },
    ])
  })

  it('em todo post e documento, os ids do índice são únicos, válidos e não repetem id da página', () => {
    const corpos = [
      ...getAllPosts().map((post) => ({ nome: post.slug, corpo: post.body })),
      { nome: 'privacidade', corpo: getLegalPage('privacidade').body },
      { nome: 'termos', corpo: getLegalPage('termos').body },
    ]
    for (const { nome, corpo } of corpos) {
      const ids = indiceDoTexto(corpo).map((item) => item.id)
      expect(new Set(ids).size, nome).toBe(ids.length)
      for (const id of ids) {
        expect(id, nome).toMatch(/^[a-z0-9-]+$/)
        expect(IDS_DA_PAGINA, `${nome}: ${id}`).not.toContain(id)
        expect(id.startsWith('categoria-'), `${nome}: ${id}`).toBe(false)
      }
    }
  })
})

describe('metadados da leitura = os das rotas atuais (spec 6)', () => {
  it('post: o mesmo <head> do /blog/[slug] atual, nos 12', async () => {
    for (const post of getAllPosts()) {
      const antigo = await metadadosAntigosDoPost({ params: Promise.resolve({ slug: post.slug }) })
      expect(metadadosDoPost(post.slug), post.slug).toEqual(antigo)
    }
  })

  it('blog, privacidade e termos: o mesmo <head> do catch-all atual', async () => {
    for (const chave of ['blog', 'privacidade', 'termos'] as const) {
      const antigo = await metadadosAntigosDaPagina({ params: Promise.resolve({ slug: [chave] }) })
      expect(metadadosDaPagina(chave), chave).toEqual(antigo)
    }
  })

  it('post inexistente: o mesmo título de 404, sem canonical', async () => {
    const antigo = await metadadosAntigosDoPost({ params: Promise.resolve({ slug: 'nao-existe' }) })
    expect(metadadosDoPost('nao-existe')).toEqual(antigo)
    expect(metadadosDoPost('nao-existe').alternates).toBeUndefined()
  })
})
