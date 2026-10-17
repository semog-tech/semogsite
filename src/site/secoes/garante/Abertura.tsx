import './abertura.css'
import { conteudo } from '@/site/conteudo/conteudo'

type Fato = { chave: string; rotulo: string; valor: string; texto?: boolean }

/** Os três fatos do Garante, na ordem do protótipo (o da equipe é texto, não número). */
function fatosDaAbertura(): Fato[] {
  const { recebe, custo, equipe } = conteudo.garantePagina.abertura.fatos
  return [
    { chave: 'recebe', ...recebe },
    { chave: 'custo', ...custo },
    { chave: 'equipe', ...equipe, texto: true },
  ]
}

/**
 * Abertura do Semog Garante: o nome com "Garante." em peso e os três fatos do produto (100%
 * recebido, 1% de custo, equipe própria). No pé, os doze meses de arrecadação prevista no mesmo
 * nível, o patamar que a cena seguinte garante mês a mês.
 */
export function AberturaDoGarante() {
  const { abertura, caixa } = conteudo.garantePagina
  return (
    <section
      id="semog-garante"
      className="cena"
      data-tema="claro"
      aria-labelledby="semog-garante-titulo"
    >
      <div className="container ga-quadro">
        <div className="ga-texto">
          <h1 id="semog-garante-titulo" className="ga-titulo entrada">
            {abertura.antes} <em className="peso">{abertura.enfase}</em>
          </h1>
          <p className="ga-lead lead entrada">{abertura.lead}</p>
          <p className="ga-origem rotulo entrada">{abertura.origem}</p>
          <div className="ga-acoes entrada">
            <a className="botao" href="#proposta">
              {abertura.botao}
              <svg className="seta" aria-hidden="true">
                <use href="#seta" />
              </svg>
            </a>
            <a className="link-seta" href="#caixa-do-condominio">
              <span>{abertura.comoFunciona}</span>
              <svg className="seta" aria-hidden="true">
                <use href="#seta" />
              </svg>
            </a>
          </div>
        </div>

        <dl className="ga-fatos">
          {fatosDaAbertura().map((fato) => (
            <div
              key={fato.chave}
              className={fato.texto ? 'ga-fato ga-fato--texto entrada' : 'ga-fato entrada'}
            >
              <dt className="rotulo">
                <span className="ga-mascara">
                  <span className="ga-in">{fato.rotulo}</span>
                </span>
              </dt>
              <dd className="num">
                <span className="ga-mascara">
                  <span className="ga-in">{fato.valor}</span>
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="ga-ano" aria-hidden="true">
          <p className="ga-ano-rotulo rotulo">
            <span className="ga-mascara">
              <span className="ga-in">{abertura.linha}</span>
            </span>
          </p>
          <div className="ga-regua">
            <span className="ga-regua-casas">
              {caixa.meses.map((mes) => (
                <i key={mes} />
              ))}
            </span>
            <span className="ga-regua-previsto" />
          </div>
          <ol className="ga-meses rotulo">
            {caixa.meses.map((mes) => (
              <li key={mes}>{mes}</li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
