import type { CartaoDePost } from '@/site/leitura/dados'

/**
 * Cartão de post (leitura.css): o link do título cobre o cartão inteiro, sem link dentro de
 * link. `nivel` segue a hierarquia da seção (h2 no índice, h3 no "Leia também").
 */
export function CartaoDoPost({ cartao, nivel }: { cartao: CartaoDePost; nivel: 'h2' | 'h3' }) {
  const Titulo = nivel
  return (
    <article className="post-cartao">
      <p className="post-meta">
        <span className="post-categoria">{cartao.categoria.titulo}</span>
        <span>{cartao.dataTexto}</span>
        <span>{cartao.minutos} min de leitura</span>
      </p>
      <Titulo className="post-cartao-titulo">
        <a href={cartao.href}>{cartao.titulo}</a>
      </Titulo>
      <p className="post-resumo">{cartao.resumo}</p>
      {/* TEXTO-NOVO: "Ler o texto" (protótipo) */}
      <p className="post-acao" aria-hidden="true">
        <span>Ler o texto</span>
        <svg className="seta" aria-hidden="true">
          <use href="#seta" />
        </svg>
      </p>
    </article>
  )
}
