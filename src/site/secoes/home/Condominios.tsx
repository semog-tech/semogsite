import './condominios.css'
import { conteudo } from '@/site/conteudo/conteudo'

/**
 * Condomínios (home): 650 barras, uma por condomínio sob gestão, o número, a grade do pattern e a
 * barra mais alta que cresce até virar o marinho dos pilares. Sem JS, lê-se o texto.
 */
export function Condominios() {
  const { numeros, condominios } = conteudo
  const { anos, clientes, especialistas } = numeros
  return (
    <section
      id="condominios"
      className="cena"
      data-tema="claro"
      aria-labelledby="condominios-titulo"
    >
      <div className="cond-palco">
        {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: o canvas não tem tabindex nem interação (o Biome o trata como focável); é decorativo e o texto ao lado é a versão completa */}
        <canvas className="cond-campo" aria-hidden="true" />
        <div className="container cond-quadro">
          <div className="cond-alvo-numero" aria-hidden="true">
            <div className="cond-alvo-glifo" />
            {/* TEXTO-NOVO */}
            <p className="cond-legenda rotulo">
              <span className="mascara">
                <span className="mascara-in">Condomínios sob gestão: cada barra é um deles.</span>
              </span>
            </p>
          </div>

          <div className="cond-texto">
            {/* TEXTO-NOVO */}
            <h2 id="condominios-titulo">
              Cada condomínio, acompanhado <em className="peso">de perto</em>.
            </h2>
            <p className="cond-destaque">
              <span className="mascara">
                <span className="mascara-in num">
                  {numeros.condominios.prefixo}
                  {numeros.condominios.valor}
                </span>
              </span>{' '}
              <span className="mascara">
                <span className="mascara-in">{numeros.condominios.rotulo}</span>
              </span>
            </p>
            <p className="lead">{condominios.texto}</p>
          </div>

          <dl className="cond-dados">
            <div>
              <dt className="mascara rotulo">
                <span className="mascara-in">{anos.rotulo}</span>
              </dt>
              <dd className="mascara">
                <span className="mascara-in num" data-conta="anos">
                  {anos.valor}
                </span>
              </dd>
            </div>
            <div>
              <dt className="mascara rotulo">
                <span className="mascara-in">{clientes.rotulo}</span>
              </dt>
              <dd className="mascara">
                <span className="mascara-in num" data-conta="clientes">
                  {clientes.prefixo}
                  {clientes.valor}
                  {clientes.sufixo}
                </span>
              </dd>
            </div>
            <div>
              <dt className="mascara rotulo">
                <span className="mascara-in">{especialistas.rotulo}</span>
              </dt>
              <dd className="mascara">
                <span className="mascara-in num" data-conta="especialistas">
                  {especialistas.prefixo}
                  {especialistas.valor}
                </span>
              </dd>
            </div>
          </dl>

          <div className="cond-alvo-grade" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
