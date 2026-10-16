import './indice-do-blog.css'
import { ImageMedia } from '@/components/Media/ImageMedia'
import { type CartaoDePost, type FiltroDeCategoria, regrasDoFiltro } from '@/site/leitura/dados'
import type { Media } from '@/types/media'
import { CartaoDoPost } from './CartaoDoPost'

export type DadosDoIndice = {
  titulo: string
  texto: string
  destaque: CartaoDePost
  imagemDoDestaque?: Media
  demais: readonly CartaoDePost[]
  filtros: readonly FiltroDeCategoria[]
}

/** Blog · índice (protótipo, sections/leitura/01-blog.html): destaque com foto e os outros em duas colunas. */
export function IndiceDoBlog({ dados }: { dados: DadosDoIndice }) {
  const { titulo, texto, destaque, imagemDoDestaque, demais, filtros } = dados
  return (
    <section id="blog-indice" className="cena" data-tema="claro" aria-labelledby="blog-titulo">
      <div className="container">
        <header className="bi-topo">
          <h1 id="blog-titulo" className="bi-titulo titulo-display">
            {titulo}
          </h1>
          <p className="bi-intro lead">{texto}</p>
        </header>

        <span id="todos" className="bi-alvo" />
        {filtros.map((filtro) => (
          <span
            key={filtro.slug}
            id={`categoria-${filtro.slug}`}
            className="bi-alvo bi-alvo--categoria"
          />
        ))}
        {/* TEXTO-NOVO: "Categorias", "Todos" (protótipo) */}
        <nav className="bi-filtros" aria-label="Categorias">
          <a className="bi-filtro bi-filtro--todos" href="#todos">
            Todos <span className="num">{demais.length + 1}</span>
          </a>
          {filtros.map((filtro) => (
            <a key={filtro.slug} className="bi-filtro" href={`#categoria-${filtro.slug}`}>
              {filtro.titulo} <span className="num">{filtro.total}</span>
            </a>
          ))}
        </nav>

        <ol className="bi-lista">
          <li className="bi-item bi-item--destaque" data-categoria={destaque.categoria.slug}>
            {imagemDoDestaque ? (
              <figure className="bi-foto">
                <ImageMedia
                  resource={imagemDoDestaque}
                  priority
                  fetchPriority="high"
                  sizes="(min-width: 1310px) 742px, (min-width: 761px) 62vw, 100vw"
                />
              </figure>
            ) : null}
            <CartaoDoPost cartao={destaque} nivel="h2" />
          </li>
          {demais.map((cartao) => (
            <li key={cartao.slug} className="bi-item" data-categoria={cartao.categoria.slug}>
              <CartaoDoPost cartao={cartao} nivel="h2" />
            </li>
          ))}
        </ol>
      </div>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: regras geradas por nós dos slugs de content/blog/categories.ts ([a-z0-9-], testado); é o filtro sem JS */}
      <style dangerouslySetInnerHTML={{ __html: regrasDoFiltro(filtros) }} />
    </section>
  )
}
