import { categories } from '@/../content/blog/categories'
import type { PostData } from '@/lib/blog'
import { caminhoDeLeitura } from './rotas'

export type CategoriaDoPost = { slug: string; titulo: string }

/** O que um cartão de post mostra (índice do blog e "Leia também"). */
export type CartaoDePost = {
  slug: string
  href: string
  titulo: string
  resumo: string
  categoria: CategoriaDoPost
  dataTexto: string
  minutos: number
}

export type FiltroDeCategoria = CategoriaDoPost & { total: number }

/** Um item do índice "Neste texto": um `##` do MDX. */
export type ItemDoIndice = { id: string; texto: string }

/** Ids das seções das páginas de leitura: um título do texto não pode repeti-los. */
export const IDS_DA_PAGINA: readonly string[] = [
  'conteudo',
  'artigo',
  'leia-tambem',
  'proposta',
  'cookies',
  'blog-indice',
  'todos',
]

/** Abaixo disso o texto é curto demais para índice (protótipo). */
export const MINIMO_PARA_INDICE = 3

const PALAVRAS_POR_MINUTO = 200

const DATA = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Recife',
})

/** "27 de agosto de 2026", no fuso do Recife (o `date` do frontmatter é UTC). */
export function dataPorExtenso(iso: string): string {
  return DATA.format(new Date(iso))
}

/** Minutos de leitura: os do frontmatter; sem eles, 200 palavras por minuto. */
export function minutosDeLeitura(post: Pick<PostData, 'readingTime' | 'body'>): number {
  if (typeof post.readingTime === 'number') return post.readingTime
  const palavras = post.body.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(palavras / PALAVRAS_POR_MINUTO))
}

/**
 * Cartão de um post. Categoria fora de `content/blog/categories.ts` derruba o build: a página
 * não inventa rótulo (teste de conteúdo garante que hoje todas existem).
 */
export function cartaoDoPost(post: PostData): CartaoDePost {
  if (!post.categoryTitle) {
    throw new Error(`[leitura] Post "${post.slug}" com categoria desconhecida: ${post.category}.`)
  }
  return {
    slug: post.slug,
    href: caminhoDeLeitura(`/blog/${post.slug}`),
    titulo: post.title,
    resumo: post.excerpt,
    categoria: { slug: post.category, titulo: post.categoryTitle },
    dataTexto: dataPorExtenso(post.date),
    minutos: minutosDeLeitura(post),
  }
}

/** Filtros do índice: as categorias com post, na ordem de `categories.ts`, com a contagem. */
export function filtrosDasCategorias(posts: readonly PostData[]): FiltroDeCategoria[] {
  return categories
    .map((categoria) => ({
      slug: categoria.slug,
      titulo: categoria.title,
      total: posts.filter((post) => post.category === categoria.slug).length,
    }))
    .filter((filtro) => filtro.total > 0)
}

/**
 * Filtro por categoria sem JS (protótipo): cada filtro é um link para uma âncora vazia
 * (`#categoria-<slug>`) e o CSS, com `:target` e `:has`, esconde os posts das outras categorias.
 * Navegador sem `:has` mostra a lista inteira. Um par de regras por categoria, gerado do mesmo
 * dado que gera os filtros; os slugs são `[a-z0-9-]` (teste em site-v2-leitura-dados).
 */
export function regrasDoFiltro(filtros: readonly Pick<FiltroDeCategoria, 'slug'>[]): string {
  return filtros
    .map(({ slug }) =>
      [
        `#blog-indice:has(#categoria-${slug}:target) .bi-item:not([data-categoria="${slug}"]) { display: none; }`,
        `#blog-indice:has(#categoria-${slug}:target) .bi-filtro[href="#categoria-${slug}"] { background: var(--marinho); border-color: var(--marinho); color: var(--branco); }`,
      ].join('\n'),
    )
    .join('\n')
}

/** Id de um título do texto: sem acento, minúsculo, hífen no lugar do resto (protótipo). */
export function idDoTitulo(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Os `##` do MDX, na ordem: o índice "Neste texto". O texto do disco pode vir com CRLF. */
export function indiceDoTexto(corpo: string): ItemDoIndice[] {
  return corpo
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .flatMap((linha) => {
      const titulo = /^## (.+)$/.exec(linha)?.[1]?.trim()
      return titulo ? [{ id: idDoTitulo(titulo), texto: titulo }] : []
    })
}
