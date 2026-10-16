import { describe, expect, it, vi } from 'vitest'
import { pages } from '@/../content/pages'
import { metadata as belem } from '@/app/(frontend)/administradora-de-condominios-belem/page'
import { metadata as campinaGrande } from '@/app/(frontend)/administradora-de-condominios-campina-grande/page'
import { metadata as joaoPessoa } from '@/app/(frontend)/administradora-de-condominios-joao-pessoa/page'
import { metadata as recife } from '@/app/(frontend)/administradora-de-condominios-recife/page'
import { findPostBySlug, getAllPosts } from '@/lib/blog'
import { OG_SITE_NAME } from '@/lib/og'
import { OG_FORA_DA_ROTA_DINAMICA, tituloDoOg } from '@/site/seo/og'
import { caminhosDoSitemap } from '@/site/sitemap'

// As páginas de cidade levam o formulário, que chega a módulos com `server-only`, e ele lança
// no jsdom do Vitest (mesma neutralização de ads-consent e desfecho-token). O `Pool` do `pg`
// em src/lib/db.ts só conecta na primeira query: importar a página não toca o banco.
vi.mock('server-only', () => ({}))

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
})
