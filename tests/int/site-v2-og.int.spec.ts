import type { Metadata } from 'next'
import { describe, expect, it, vi } from 'vitest'
import { pages } from '@/../content/pages'
import { generateMetadata as metadadosDaPaginaNoAr } from '@/app/(frontend)/[[...slug]]/page'
import { metadata as belem } from '@/app/(frontend)/administradora-de-condominios-belem/page'
import { metadata as campinaGrande } from '@/app/(frontend)/administradora-de-condominios-campina-grande/page'
import { metadata as joaoPessoa } from '@/app/(frontend)/administradora-de-condominios-joao-pessoa/page'
import { metadata as recife } from '@/app/(frontend)/administradora-de-condominios-recife/page'
import { generateMetadata as metadadosDoPostNoAr } from '@/app/(frontend)/blog/[slug]/page'
import { findPostBySlug, getAllPosts } from '@/lib/blog'
import { OG_SITE_NAME } from '@/lib/og'
import { OG_FORA_DA_ROTA_DINAMICA, tituloDoOg } from '@/site/seo/og'
import { caminhosDoSitemap } from '@/site/sitemap'
import { rotaQueAtende, rotasDoApp } from './helpers/rotas-app'

// As páginas de cidade levam o formulário, que chega a módulos com `server-only`, e ele lança
// no jsdom do Vitest (mesma neutralização de ads-consent e desfecho-token). O `Pool` do `pg`
// em src/lib/db.ts só conecta na primeira query: importar a página não toca o banco.
vi.mock('server-only', () => ({}))
// O catch-all importa todos os blocos do site atual; generateMetadata não usa nenhum.
vi.mock('@/blocks/RenderBlocks', () => ({ RenderBlocks: () => null }))

type ImagemDeMetadata = NonNullable<Metadata['openGraph']>['images']

/** Caminhos (sem host) das imagens que a metadata declara em og:image e twitter:image. */
function caminhosDeImagem(metadata: Metadata): string[] {
  const declaradas: ImagemDeMetadata[] = [metadata.openGraph?.images, metadata.twitter?.images]
  return declaradas
    .flatMap((imagens) => (Array.isArray(imagens) ? imagens : imagens ? [imagens] : []))
    .map((imagem) => {
      if (typeof imagem === 'string') return imagem
      return imagem instanceof URL ? imagem.href : imagem.url.toString()
    })
    .map((url) => new URL(url, 'https://www.semog.com.br').pathname)
}

/** O <head> que o site atual monta para a URL (o mesmo generateMetadata das rotas no ar). */
async function metadataDoNoAr(caminho: string): Promise<Metadata> {
  const post = /^\/blog\/([a-z0-9-]+)$/.exec(caminho)?.[1]
  if (post) return metadadosDoPostNoAr({ params: Promise.resolve({ slug: post }) })
  const slug = caminho.split('/').filter(Boolean)
  return metadadosDaPaginaNoAr({ params: Promise.resolve({ slug }) })
}

const COM_IMAGEM_PROPRIA = [
  '/experience',
  ...[...OG_FORA_DA_ROTA_DINAMICA].filter((c) => c.startsWith('/administradora-')),
]

describe('OG do inventário', () => {
  it('toda página do sitemap que usa a rota dinâmica tem título próprio (nada cai no nome do site)', () => {
    const caminhos = [
      ...caminhosDoSitemap(),
      ...getAllPosts().map((post) => `/blog/${post.slug}`),
    ].filter((caminho) => !OG_FORA_DA_ROTA_DINAMICA.has(caminho))
    expect(caminhos.length).toBeGreaterThanOrEqual(24)
    expect(caminhos.filter((caminho) => tituloDoOg(caminho) === OG_SITE_NAME)).toEqual([])
  })

  it('página: meta.title, senão title (a prioridade do <title>); post: o título do post', () => {
    const semog = pages.semog
    expect(tituloDoOg('/semog')).toBe(semog?.meta?.title || semog?.title)
    expect(tituloDoOg('/blog/g20-superlogica-next-2026')).toBe(
      findPostBySlug('g20-superlogica-next-2026')?.title,
    )
  })

  it('URL desconhecida e post inexistente caem no nome do site (a rota de imagem nunca lança)', () => {
    expect(tituloDoOg('/nao-existe')).toBe(OG_SITE_NAME)
    expect(tituloDoOg('/blog/nao-existe')).toBe(OG_SITE_NAME)
  })

  it('fora da rota dinâmica: a home (card padrão), o Experience e as cidades', () => {
    expect([...OG_FORA_DA_ROTA_DINAMICA].sort()).toEqual([
      '/',
      '/administradora-de-condominios-belem',
      '/administradora-de-condominios-campina-grande',
      '/administradora-de-condominios-joao-pessoa',
      '/administradora-de-condominios-recife',
      '/experience',
    ])
  })

  it('as cidades declaram imagem própria, e por isso podem ficar fora', () => {
    for (const cidade of [recife, joaoPessoa, campinaGrande, belem]) {
      const imagens = JSON.stringify(cidade.openGraph?.images ?? null)
      expect(imagens).not.toBe('null')
      expect(imagens).not.toContain('opengraph-image')
    }
  })

  it('a imagem OG declarada por cada URL do sitemap é servida por uma rota de OG (nada de 404)', async () => {
    const rotas = rotasDoApp()
    const caminhos = [
      ...caminhosDoSitemap(),
      ...getAllPosts().map((post) => `/blog/${post.slug}`),
    ].filter((caminho) => !COM_IMAGEM_PROPRIA.includes(caminho))
    const quebradas: string[] = []
    for (const caminho of caminhos) {
      const imagens = caminhosDeImagem(await metadataDoNoAr(caminho))
      expect(imagens.length, `${caminho} sem imagem OG`).toBeGreaterThan(0)
      for (const imagem of imagens) {
        if (rotaQueAtende(imagem, rotas)?.arquivo !== 'opengraph-image') {
          quebradas.push(`${caminho} -> ${imagem}`)
        }
      }
    }
    expect(quebradas).toEqual([])
  })

  it('o modelo de rotas pega o caso real: sem a rota do índice, /blog/opengraph-image cai num post', () => {
    const rotas = rotasDoApp()
    expect(rotaQueAtende('/blog/opengraph-image', rotas)?.arquivo).toBe('opengraph-image')
    const semIndice = rotas.filter(
      (rota) =>
        !(
          rota.arquivo === 'opengraph-image' && rota.segmentos.join('/') === 'blog/opengraph-image'
        ),
    )
    expect(rotaQueAtende('/blog/opengraph-image', semIndice)?.arquivo).toBe('page')
  })

  it('a URL nova /tecnologia tem título próprio no card (a fase 4 a tira do content/pages)', () => {
    expect(tituloDoOg('/tecnologia')).toBe('Tecnologia · Semog One, a plataforma própria da Semog')
  })
})
