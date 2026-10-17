import './garante.css'
import { conteudo } from '@/site/conteudo/conteudo'
import { caminhoNoSite } from '@/site/rotas'

/**
 * Soluções · Semog Garante, a troca de mundo da página: marinho, o nome e o texto à esquerda, os
 * dois números do produto à direita (100% recebido, como na abertura do Garante; 1% de custo). No
 * pé, os quatro ganhos numa fila ligada pelo traço céu dos papéis do Garante.
 */
export function GaranteNasSolucoes() {
  const { garante } = conteudo.solucoesPagina
  const { recebe } = conteudo.garantePagina.abertura.fatos
  const fatos = [
    { chave: 'recebe', ...recebe },
    { chave: 'custo', ...garante.custo },
  ]
  return (
    <section
      id="garante"
      className="cena sl-garante"
      data-tema="marinho"
      aria-labelledby="garante-titulo"
    >
      <div className="container sl-ga-topo">
        <div className="sl-ga-texto">
          <h2 id="garante-titulo" className="sl-ga-titulo">
            {garante.titulo}
          </h2>
          <p className="sl-ga-lead">{garante.texto}</p>
          <a className="link-seta" href={caminhoNoSite('/garante')}>
            <span>{garante.link}</span>
            <svg className="seta" aria-hidden="true">
              <use href="#seta" />
            </svg>
          </a>
        </div>
        <dl className="sl-ga-fatos">
          {fatos.map((fato) => (
            <div key={fato.chave} className="sl-ga-fato">
              <dt className="rotulo">{fato.rotulo}</dt>
              <dd className="num">
                <span className="sl-ga-mascara">
                  <span className="sl-ga-in">{fato.valor}</span>
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="container sl-ga-fila">
        <span className="sl-ga-linha" aria-hidden="true" />
        <ul className="sl-ga-lista">
          {garante.itens.map((item) => (
            <li key={item.titulo} className="sl-ga-item">
              <i className="sl-ga-no" aria-hidden="true" />
              <h3>{item.titulo}</h3>
              <p>{item.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
