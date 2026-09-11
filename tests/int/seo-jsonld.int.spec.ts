import { describe, expect, it } from 'vitest'
import { CITY_LANDINGS } from '@/data/cityLandings'
import { getAllPosts } from '@/lib/blog'
import { absoluteUrl, cityLandingJsonLd, getOrganizationJsonLd, getPostJsonLd } from '@/lib/seo'

/**
 * Trava as regras do dado estruturado que a auditoria de 11/09/2026 pegou
 * quebradas: post sem `BlogPosting` nenhum, `parentOrganization` apontando pra
 * um nó que só existe na home, telefone de atendimento com DDD de outro estado
 * e `hasMap` mirando numa busca em vez da ficha.
 */

type Node = Record<string, unknown>

/** Sem `expect` de propósito: roda no corpo do `describe`, fora de um teste. */
function graphOf(jsonLd: Record<string, unknown> | null): Node[] {
  const graph = jsonLd?.['@graph']
  if (!Array.isArray(graph)) throw new Error('JSON-LD sem @graph')
  return graph as Node[]
}

function findByType(graph: Node[], type: string): Node | undefined {
  return graph.find((node) => node['@type'] === type)
}

/** Todo `@id` referenciado (`{'@id': ...}` aninhado) tem que existir no grafo. */
function danglingRefs(graph: Node[]): string[] {
  const defined = new Set(graph.map((node) => node['@id']).filter(Boolean) as string[])
  const referenced: string[] = []
  const walk = (value: unknown, isRoot: boolean): void => {
    if (Array.isArray(value)) {
      for (const item of value) walk(item, false)
      return
    }
    if (!value || typeof value !== 'object') return
    const obj = value as Node
    // Um objeto SÓ com `@id` é referência; com `@type` junto, é definição.
    if (!isRoot && typeof obj['@id'] === 'string' && !obj['@type']) referenced.push(obj['@id'])
    for (const v of Object.values(obj)) walk(v, false)
  }
  for (const node of graph) walk(node, true)
  return referenced.filter((id) => !defined.has(id))
}

describe('JSON-LD dos posts do blog', () => {
  const posts = getAllPosts()

  it('existe um post pra testar', () => {
    expect(posts.length).toBeGreaterThan(0)
  })

  for (const post of posts) {
    describe(post.slug, () => {
      const graph = graphOf(getPostJsonLd(post))

      it('emite BlogPosting com data, autor, editor e imagem', () => {
        const article = findByType(graph, 'BlogPosting')
        expect(article).toBeDefined()
        expect(article?.headline).toBe(post.title)
        // Data do frontmatter, sem invenção: publicação e modificação são a
        // mesma porque é só isso que o conteúdo declara.
        expect(article?.datePublished).toBe(post.date)
        expect(article?.dateModified).toBe(post.date)
        expect(article?.author).toEqual({ '@id': `${absoluteUrl('')}#org` })
        expect(article?.publisher).toEqual({ '@id': `${absoluteUrl('')}#org` })
        expect(article?.mainEntityOfPage).toEqual({
          '@type': 'WebPage',
          '@id': absoluteUrl(`blog/${post.slug}`),
        })
        expect(article?.image).toEqual([post.heroImage?.url])
      })

      it('emite a trilha Início › Blog › post', () => {
        const trail = findByType(graph, 'BreadcrumbList')?.itemListElement as Node[] | undefined
        expect(trail?.map((item) => item.item)).toEqual([
          absoluteUrl(''),
          absoluteUrl('blog'),
          absoluteUrl(`blog/${post.slug}`),
        ])
      })

      it('não deixa referência de @id sem nó correspondente', () => {
        expect(danglingRefs(graph)).toEqual([])
      })
    })
  }
})

describe('JSON-LD das landings de cidade', () => {
  for (const data of Object.values(CITY_LANDINGS)) {
    describe(data.slug, () => {
      const graph = graphOf(cityLandingJsonLd(data.slug, data.faq))

      it('define a Organization que o LocalBusiness diz ser a matriz', () => {
        const business = findByType(graph, 'LocalBusiness')
        expect(business?.parentOrganization).toEqual({ '@id': `${absoluteUrl('')}#org` })
        expect(danglingRefs(graph)).toEqual([])
      })

      it('aponta hasMap pra ficha exata, não pra uma busca', () => {
        const business = findByType(graph, 'LocalBusiness')
        expect(business?.hasMap).toMatch(/^https:\/\/www\.google\.com\/maps\?cid=\d+$/)
        const sameAs = business?.sameAs as string[]
        expect(
          sameAs.some((url) =>
            /^https:\/\/www\.google\.com\/maps\/place\/\?q=place_id:[\w-]+$/.test(url),
          ),
        ).toBe(true)
      })

      it('usa o mesmo destino de mapa que o botão "Como chegar" da página', () => {
        const business = findByType(graph, 'LocalBusiness')
        expect(business?.hasMap).toBe(data.unit.mapsHref)
      })
    })
  }
})

describe('JSON-LD da home', () => {
  const graph = graphOf(getOrganizationJsonLd())

  it('atende pelo fixo do Recife e vende pelo WhatsApp', () => {
    const org = findByType(graph, 'Organization')
    const pontos = org?.contactPoint as Node[]
    expect(Array.isArray(pontos)).toBe(true)
    const atendimento = pontos.find((p) => p.contactType === 'customer service')
    const comercial = pontos.find((p) => p.contactType === 'sales')
    // O 3003 tem DDD 11 (São Paulo) e não pode ser o canal de atendimento de
    // uma empresa cujas unidades são 81, 83 e 91.
    expect(atendimento?.telephone).toBe('+558133160265')
    expect(comercial?.telephone).toBe('+551130034506')
  })

  it('não deixa referência de @id sem nó correspondente', () => {
    expect(danglingRefs(graph)).toEqual([])
  })
})
