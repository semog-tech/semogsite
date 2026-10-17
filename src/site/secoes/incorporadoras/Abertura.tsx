import './abertura.css'
import { conteudo } from '@/site/conteudo/conteudo'

type Numero = { chave: string; rotulo: string; valor: number; prefixo?: string }

/** Os quatro números da abertura, na ordem do protótipo (o de condomínios é o da casa). */
function numerosDaAbertura(): Numero[] {
  const { implantados, anos, pracas } = conteudo.incorporadoras.numeros
  return [
    { chave: 'implantados', ...implantados },
    { chave: 'anos', ...anos },
    { chave: 'condominios', ...conteudo.numeros.condominios },
    { chave: 'pracas', ...pracas },
  ]
}

/**
 * Abertura de Incorporadoras: a promessa com "bem antes das chaves." em peso e, ao lado, a obra ao
 * anoitecer, sem legenda. No pé da dobra, os números que sustentam a promessa, contando ao entrar.
 */
export function AberturaDasIncorporadoras() {
  const { abertura } = conteudo.incorporadoras
  return (
    <section
      id="incorporadoras"
      className="cena"
      data-tema="claro"
      aria-labelledby="incorporadoras-titulo"
    >
      <div className="container ab-quadro">
        <div className="ab-texto">
          <h1 id="incorporadoras-titulo" className="ab-titulo entrada">
            {abertura.antes} <em className="peso">{abertura.enfase}</em>
          </h1>
          <p className="ab-lead lead entrada">{abertura.lead}</p>
          <div className="ab-acoes entrada">
            <a className="botao" href="#proposta">
              {abertura.botao}
              <svg className="seta" aria-hidden="true">
                <use href="#seta" />
              </svg>
            </a>
            <a className="link-seta" href="#percurso">
              <span>{abertura.percurso}</span>
              <svg className="seta" aria-hidden="true">
                <use href="#seta" />
              </svg>
            </a>
          </div>
        </div>

        <figure className="ab-foto">
          <div className="moldura">
            {/* biome-ignore lint/performance/noImgElement: a cena anima moldura e parallax no próprio <img>, e /site-v2 fica fora do localPatterns do next/image */}
            <img
              src={abertura.foto}
              alt={abertura.fotoAlt}
              width={2048}
              height={1152}
              decoding="async"
            />
          </div>
        </figure>

        <dl className="ab-numeros">
          {numerosDaAbertura().map((numero) => (
            <div key={numero.chave} className="ab-numero entrada">
              <dt className="rotulo">
                <span className="ab-mascara">
                  <span className="ab-in">{numero.rotulo}</span>
                </span>
              </dt>
              <dd className="num">
                <span className="ab-mascara">
                  <span className="ab-in" data-conta={numero.valor} data-prefixo={numero.prefixo}>
                    {numero.prefixo}
                    {numero.valor}
                  </span>
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
