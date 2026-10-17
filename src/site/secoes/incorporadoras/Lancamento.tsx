import './lancamento.css'
import { conteudo } from '@/site/conteudo/conteudo'

/**
 * Lançamento: o convite antes do pedido de proposta, com "no radar?" em peso; o botão desce ao
 * pedido, que nesta página já chega com "Construtora" marcado. Na saída, a coluna lavanda sobe e
 * vira o véu do pedido de proposta.
 */
export function Lancamento() {
  const { lancamento } = conteudo.incorporadoras
  return (
    <section id="lancamento" className="cena" data-tema="claro" aria-labelledby="lancamento-titulo">
      <div className="container ln-quadro">
        <h2 id="lancamento-titulo" className="ln-titulo titulo-display">
          {lancamento.tituloA} <em className="peso">{lancamento.tituloB}</em>
        </h2>
        <div className="ln-corpo">
          <p className="ln-texto">{lancamento.texto}</p>
          <div className="ln-acoes">
            <a className="botao" href="#proposta">
              {lancamento.botao}
              <svg className="seta" aria-hidden="true">
                <use href="#seta" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="ln-saida" aria-hidden="true">
        <span className="ln-veu" />
      </div>
    </section>
  )
}
