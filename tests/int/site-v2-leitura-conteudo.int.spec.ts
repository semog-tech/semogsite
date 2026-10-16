import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { describe, expect, it } from 'vitest'
import { findPostBySlug, getAllPosts } from '@/lib/blog'
import { entradaDe } from '@/site/inventario'
import { procurarTermosVedados, textosDe } from './helpers/identidade'
import { hashesMalformados, linksDoMdx } from './helpers/leitura'

type ArquivoMdx = { arquivo: string; dados: Record<string, unknown>; corpo: string }

function lerMdx(pasta: 'blog' | 'legal'): ArquivoMdx[] {
  const raiz = path.join(process.cwd(), 'content', pasta)
  return readdirSync(raiz)
    .filter((nome) => nome.endsWith('.mdx'))
    .map((nome) => {
      const texto = readFileSync(path.join(raiz, nome), 'utf8').replace(/\r\n?/g, '\n')
      const { data, content } = matter(texto)
      return { arquivo: `content/${pasta}/${nome}`, dados: data, corpo: content }
    })
}

const ARQUIVOS = [...lerMdx('blog'), ...lerMdx('legal')]
/** "Semog" e assume/assumiu/assumir na mesma frase (regra: a Semog assessora, não assume). */
const SEMOG_ASSUME = /\bSemog\b[^.!?\n]*\bassum(?:e|iu|ir)\b/i

const SLUGS = new Set(getAllPosts().map((post) => post.slug))

describe('texto do blog e dos documentos (site v2, spec 3.3 e 6)', () => {
  it('acha os 12 posts e os 2 documentos (zero arquivo não pode passar verde)', () => {
    expect(ARQUIVOS.filter((a) => a.arquivo.startsWith('content/blog/'))).toHaveLength(12)
    expect(ARQUIVOS.filter((a) => a.arquivo.startsWith('content/legal/'))).toHaveLength(2)
  })

  it('nenhum título, resumo, meta, "Em resumo" ou corpo usa termo vedado (o slug fica de fora)', () => {
    const achados = ARQUIVOS.flatMap(({ arquivo, dados, corpo }) => {
      const textos = [...textosDe({ ...dados, slug: undefined }), corpo]
      return procurarTermosVedados(textos.join('\n')).map((termo) => `${arquivo}: ${termo}`)
    })
    expect(achados).toEqual([])
  })

  it('a varredura pega o termo no título mesmo com o slug limpo', () => {
    const dados = { title: 'Tem validade jurídica?', slug: 'sem-termo' }
    expect(procurarTermosVedados(textosDe({ ...dados, slug: undefined }).join('\n'))).toEqual([
      'validade jurídica',
    ])
  })

  it('o texto não faz a Semog "assumir" (ela assessora); a frase genérica de administradora fica', () => {
    // O padrão já para no fim da frase, então vale sobre o texto inteiro.
    const achados = ARQUIVOS.filter(({ corpo }) => SEMOG_ASSUME.test(corpo)).map(
      ({ arquivo }) => arquivo,
    )
    expect(achados).toEqual([])
    expect(SEMOG_ASSUME.test('Na Semog, alguém assumiu o controle.')).toBe(true)
    expect(SEMOG_ASSUME.test('A Semog assume a gestão.')).toBe(true)
    expect(
      SEMOG_ASSUME.test('Quando uma administradora assume o condomínio, o síndico acompanha.'),
    ).toBe(false)
  })

  it('o post de assembleia virtual mantém o slug e ganha o título do protótipo', () => {
    const post = findPostBySlug('assembleia-virtual-validade-juridica')
    expect(post?.title).toBe('Assembleia virtual vale? O que a lei permite')
    expect(post?.meta?.title).toBe('Assembleia virtual vale? O que a lei permite em 2026')
  })

  it('a regra do hash acusa o que o Lenis não decodifica e o que não é id do site', () => {
    expect(hashesMalformados('[x](#%E0%A4%A)')).toEqual(['#%E0%A4%A'])
    expect(hashesMalformados('[x](/garante#ok-1)')).toEqual([])
    expect(hashesMalformados('<a href="#Seção">x</a>')).toEqual(['#Seção'])
    expect(hashesMalformados('[x](#cookies) e [y](/blog/a#um-titulo)')).toEqual([])
    // Link com título opcional e destino entre <...>: o CommonMark aceita os dois.
    expect(hashesMalformados('[x](/garante#%E0%A4%A "t")')).toEqual(['/garante#%E0%A4%A'])
    expect(hashesMalformados("[x](/garante#%E0%A4%A 't')")).toEqual(['/garante#%E0%A4%A'])
    expect(hashesMalformados('[x](</garante#%E0%A4%A> "t")')).toEqual(['/garante#%E0%A4%A'])
    expect(hashesMalformados('[x](/garante#ok-1 "título")')).toEqual([])
    expect(linksDoMdx('[x](/a "t") e [y](</b>)')).toEqual(['/a', '/b'])
  })

  it('nenhum link do texto tem hash malformado', () => {
    const achados = ARQUIVOS.flatMap(({ arquivo, corpo }) =>
      hashesMalformados(corpo).map((destino) => `${arquivo}: ${destino}`),
    )
    expect(achados).toEqual([])
  })

  it('a única âncora da própria página é o #cookies da Privacidade (nova âncora pede revisão)', () => {
    const ancoras = ARQUIVOS.flatMap(({ arquivo, corpo }) =>
      linksDoMdx(corpo)
        .filter((destino) => destino.startsWith('#'))
        .map((destino) => `${arquivo}: ${destino}`),
    )
    expect(ancoras).toEqual(['content/legal/privacidade.mdx: #cookies'])
  })

  it('todo link interno do texto cai numa página do inventário (post: um post que existe)', () => {
    const internos = ARQUIVOS.flatMap(({ arquivo, corpo }) =>
      linksDoMdx(corpo)
        .filter((destino) => destino.startsWith('/'))
        .map((destino) => ({ arquivo, caminho: destino.split('#')[0] || '/' })),
    )
    expect(internos.length).toBeGreaterThan(0)
    for (const { arquivo, caminho } of internos) {
      expect(entradaDe(caminho)?.tipo, `${arquivo}: ${caminho}`).toBe('pagina')
      if (caminho.startsWith('/blog/')) {
        expect(SLUGS.has(caminho.slice('/blog/'.length)), `${arquivo}: ${caminho}`).toBe(true)
      }
    }
  })

  it('todo post tem o que a página de leitura mostra: categoria conhecida, resumo, foto e minutos', () => {
    for (const post of getAllPosts()) {
      expect(post.categoryTitle, post.slug).toBeTruthy()
      expect(post.excerpt, post.slug).not.toBe('')
      expect(post.heroImage?.url, post.slug).toBeTruthy()
      expect(post.readingTime, post.slug).toBeGreaterThan(0)
    }
  })
})
