import './abertura.css'
import { conteudo } from '@/site/conteudo/conteudo'

type Numero = { chave: string; rotulo: string; texto: string; contar?: number; prefixo?: string }

/** Os três números do pé da abertura, na ordem do protótipo. */
function numerosDaAbertura(): Numero[] {
  const { numeros, ranking, gestaoPagina } = conteudo
  const { anos, condominios } = numeros
  return [
    {
      chave: 'anos',
      rotulo: `${anos.rotulo}, ${anos.detalhe}`,
      texto: `${anos.valor}`,
      contar: anos.valor,
    },
    {
      chave: 'condominios',
      rotulo: condominios.rotulo,
      texto: `${condominios.prefixo}${condominios.valor}`,
      contar: condominios.valor,
      prefixo: condominios.prefixo,
    },
    { chave: 'ranking', rotulo: gestaoPagina.abertura.ranking, texto: `${ranking.posicao}º` },
  ]
}

/**
 * Abertura da Gestão: o H1 com "por inteiro." em peso, o lead, o pedido de proposta e três números
 * da Semog sob um traço marinho; à direita, a coluna gelo com as sete frentes de um contrato só.
 */
export function AberturaDaGestao() {
  const { abertura } = conteudo.gestaoPagina
  return (
    <section
      id="administracao-de-condominios"
      className="cena"
      data-tema="claro"
      aria-labelledby="administracao-de-condominios-titulo"
    >
      <div className="gab-esquerda">
        <div className="gab-texto">
          <h1 id="administracao-de-condominios-titulo" className="gab-titulo entrada">
            {abertura.antes} <em className="peso">{abertura.enfase}</em>
          </h1>
          <p className="gab-lead lead entrada">{abertura.lead}</p>
          <div className="gab-acoes entrada">
            <a className="botao" href="#proposta">
              {abertura.botao}
              <svg className="seta" aria-hidden="true">
                <use href="#seta" />
              </svg>
            </a>
            <a className="link-seta" href="#mesa-do-sindico">
              <span>{abertura.mesa}</span>
              <svg className="seta" aria-hidden="true">
                <use href="#seta" />
              </svg>
            </a>
          </div>
          <p className="gab-prazo rotulo entrada">{abertura.prazo}</p>
        </div>

        <dl className="gab-numeros entrada">
          <span className="gab-traco" aria-hidden="true" />
          {numerosDaAbertura().map((numero) => (
            <div key={numero.chave} className="gab-numero">
              <dt className="rotulo">
                <span className="gab-mascara">
                  <span className="gab-in">{numero.rotulo}</span>
                </span>
              </dt>
              <dd className="num">
                <span className="gab-mascara">
                  <span
                    className="gab-in"
                    data-contar={numero.contar}
                    data-prefixo={numero.prefixo}
                  >
                    {numero.texto}
                  </span>
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="gab-direita entrada">
        <div className="gab-contrato">
          <h2 className="gab-contrato-titulo">
            <span className="gab-mascara">
              <span className="gab-in">{abertura.contrato}</span>
            </span>
          </h2>
          <ul className="gab-frentes">
            {abertura.frentes.map((frente) => (
              <li key={frente} className="gab-frente">
                <i aria-hidden="true" />
                <span className="gab-mascara">
                  <span className="gab-in">{frente}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
