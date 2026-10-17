import { notFound } from 'next/navigation'
import { getLegalPage } from '@/../content/lib/legal'
import { findPostBySlug, getAllPosts, listRelatedPosts } from '@/lib/blog'
import { getPageJsonLd, getPostJsonLd } from '@/lib/seo'
import { conteudo } from '@/site/conteudo/conteudo'
import { EsqueletoLeitura } from '@/site/layout/EsqueletoLeitura'
import { cartaoDoPost, filtrosDasCategorias, indiceDoTexto } from '@/site/leitura/dados'
import { corpoDoMdx } from '@/site/leitura/mdx'
import { type DocumentoLegal, paginaDoConteudo } from '@/site/leitura/metadados'
import { caminhoDeLeitura } from '@/site/leitura/rotas'
import { Artigo, type DadosDoArtigo } from '@/site/secoes/leitura/Artigo'
import { IndiceDoBlog } from '@/site/secoes/leitura/IndiceDoBlog'
import { LeiaTambem } from '@/site/secoes/leitura/LeiaTambem'
import { PreferenciasDeCookies } from '@/site/secoes/leitura/PreferenciasDeCookies'
import { SecaoProposta } from '@/site/secoes/proposta/SecaoProposta'

/*
 * Corpo das páginas de leitura. As rotas da prévia (src/app/(site)/(leitura)/previa-v2/...) só
 * decidem prévia, metadata e params; na virada 1, as rotas reais usam estes mesmos corpos.
 */

const LEIA_TAMBEM = 2

function JsonLd({ dados }: { dados: Record<string, unknown> | null }) {
  if (!dados) return null
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD serializado por nós, do conteúdo estático
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dados) }}
    />
  )
}

/** Índice do blog: o post mais recente em destaque, com foto; os outros em duas colunas. */
export function PaginaDoBlog() {
  const posts = getAllPosts()
  const [destaque, ...demais] = posts
  if (!destaque) throw new Error('[leitura] O blog não tem nenhum post.')
  const { titulo, texto } = conteudo.comunidade.blog
  return (
    <EsqueletoLeitura pagina="blog" atual="blog">
      <JsonLd dados={getPageJsonLd({ page: paginaDoConteudo('blog'), path: 'blog' })} />
      <IndiceDoBlog
        dados={{
          titulo,
          texto,
          destaque: cartaoDoPost(destaque),
          imagemDoDestaque: destaque.heroImage,
          demais: demais.map(cartaoDoPost),
          filtros: filtrosDasCategorias(posts),
        }}
      />
      <SecaoProposta />
    </EsqueletoLeitura>
  )
}

/** Um post: o artigo, "Leia também" e o pedido de proposta. Slug desconhecido é 404. */
export async function PaginaDoPost({ slug }: { slug: string }) {
  const post = findPostBySlug(slug)
  if (!post) notFound()
  const cartao = cartaoDoPost(post)
  const dados: DadosDoArtigo = {
    titulo: post.title,
    resumo: post.excerpt || undefined,
    topo: {
      tipo: 'post',
      categoria: cartao.categoria.titulo,
      dataTexto: cartao.dataTexto,
      minutos: cartao.minutos,
      voltar: caminhoDeLeitura('/blog'),
    },
    imagem: post.heroImage,
    indice: indiceDoTexto(post.body),
    emResumo: post.keyTakeaways ?? [],
    corpo: await corpoDoMdx(post.body),
  }
  const leiaTambem = listRelatedPosts(post.category, post.slug, LEIA_TAMBEM).map(cartaoDoPost)
  return (
    <EsqueletoLeitura pagina="post" atual="blog">
      <JsonLd dados={getPostJsonLd(post)} />
      <Artigo dados={dados} />
      <LeiaTambem cartoes={leiaTambem} todos={caminhoDeLeitura('/blog')} />
      <SecaoProposta />
    </EsqueletoLeitura>
  )
}

/** Privacidade e Termos: o mesmo artigo, com a data de atualização; a Privacidade tem os cookies. */
export async function PaginaDoDocumento({ slug }: { slug: DocumentoLegal }) {
  const documento = getLegalPage(slug)
  const dados: DadosDoArtigo = {
    titulo: documento.title,
    topo: { tipo: 'documento', atualizacao: documento.updatedText },
    indice: indiceDoTexto(documento.body),
    emResumo: [],
    corpo: await corpoDoMdx(documento.body),
    depoisDoCorpo: slug === 'privacidade' ? <PreferenciasDeCookies /> : null,
  }
  return (
    <EsqueletoLeitura pagina={slug}>
      <JsonLd dados={getPageJsonLd({ page: paginaDoConteudo(slug), path: slug })} />
      <Artigo dados={dados} />
      <SecaoProposta />
    </EsqueletoLeitura>
  )
}
