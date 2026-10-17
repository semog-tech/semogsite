import './abertura.css'
import { conteudo } from '@/site/conteudo/conteudo'

/** Soluções · abertura: o que a Semog cobre, numa frase, e o pedido de proposta. */
export function AberturaDeSolucoes() {
  const { abertura } = conteudo.solucoesPagina
  return (
    <section
      id="solucoes"
      className="cena sl-abertura"
      data-tema="claro"
      aria-labelledby="sl-titulo"
    >
      <div className="container">
        <h1 id="sl-titulo" className="sl-titulo">
          {abertura.antes} <em className="peso">{abertura.enfase}</em>
        </h1>
        <p className="lead">{abertura.lead}</p>
        <div className="sl-acoes">
          <a className="botao" href="#proposta">
            {abertura.botao}
            <svg className="seta" aria-hidden="true">
              <use href="#seta" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
