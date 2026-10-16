import type { MetadataRoute } from 'next'
import type { PostData } from '@/lib/blog'
import { absoluteUrl } from '@/lib/seo'
import { INVENTARIO, servidaComoPagina, VIRADA_1_FEITA } from './inventario'

export type PostDoSitemap = Pick<PostData, 'slug' | 'date'>

type Preferencia = Pick<MetadataRoute.Sitemap[number], 'changeFrequency' | 'priority'>

/** Páginas de captação: é nelas que o Ads e o orgânico comercial caem. */
const CAPTACAO: Preferencia = { changeFrequency: 'weekly', priority: 0.9 }
/** Peça de campanha com prazo, abaixo das cidades. */
const CAMPANHA: Preferencia = { changeFrequency: 'weekly', priority: 0.8 }

const PREFERENCIAS: Readonly<Record<string, Preferencia>> = {
  '/administradora-de-condominios-recife': CAPTACAO,
  '/administradora-de-condominios-joao-pessoa': CAPTACAO,
  '/administradora-de-condominios-campina-grande': CAPTACAO,
  '/administradora-de-condominios-belem': CAPTACAO,
  '/experience': CAMPANHA,
}

/**
 * Rotas de grupos intocados (spec 6) que o sitemap lista. A landing do Semog Experience vive no
 * grupo `(evento)`, fora do inventário de páginas, e o comentário do sitemap antigo já previa
 * tirá-la depois do evento (26/09/2026): decisão pendente, fora desta fase.
 */
export const INTOCADAS_NO_SITEMAP: readonly string[] = ['/experience']

/** Caminhos fixos do sitemap: o que o inventário diz que responde como página, e as intocadas. */
export function caminhosDoSitemap(viradaFeita: boolean = VIRADA_1_FEITA): string[] {
  const paginas = Object.entries(INVENTARIO)
    .filter(([, entrada]) => servidaComoPagina(entrada, viradaFeita))
    .map(([caminho]) => caminho)
  return [...paginas, ...INTOCADAS_NO_SITEMAP]
}

/**
 * `/sitemap.xml` a partir do inventário de URLs do site v2 (spec 6). Antes, a lista saía das
 * chaves de `content/pages`, e migrar uma página para o site v2 a tiraria do sitemap em silêncio.
 * As páginas usam a data do build (o conteúdo estático não tem data de edição); os posts, a
 * `date` do frontmatter.
 */
export function entradasDoSitemap(
  posts: readonly PostDoSitemap[],
  agora: Date,
  viradaFeita: boolean = VIRADA_1_FEITA,
): MetadataRoute.Sitemap {
  const fixas: MetadataRoute.Sitemap = caminhosDoSitemap(viradaFeita).map((caminho) => ({
    url: absoluteUrl(caminho),
    lastModified: agora,
    ...PREFERENCIAS[caminho],
  }))
  const dosPosts: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`blog/${post.slug}`),
    lastModified: new Date(post.date),
  }))
  return [...fixas, ...dosPosts]
}
