import './troca.css'
import { conteudo } from '@/site/conteudo/conteudo'

/** As marcas dos boletos e pagamentos na fileira do condomínio (24, como no protótipo). */
const MARCAS = Array.from({ length: 24 }, (_, i) => i)

function Marcas({ feitas }: { feitas?: boolean }) {
  return (
    <span className={feitas ? 'gtr-marcas gtr-marcas--feitas' : 'gtr-marcas'} aria-hidden="true">
      {MARCAS.map((marca) => (
        <i key={marca} />
      ))}
    </span>
  )
}

/**
 * Troca de administradora: o título com "sem interromper nada." em peso e dois trilhos que a
 * rolagem percorre juntos, o dos três passos da troca e o dos boletos do condomínio, sem nenhum vão.
 */
export function TrocaDeAdministradora() {
  const { troca } = conteudo.gestaoPagina
  return (
    <section
      id="troca-de-administradora"
      className="cena"
      data-tema="claro"
      aria-labelledby="troca-de-administradora-titulo"
    >
      <div className="container gtr-cabeca">
        <h2 id="troca-de-administradora-titulo" className="gtr-titulo">
          {troca.tituloA} <em className="peso">{troca.tituloB}</em>
        </h2>
      </div>

      <div className="container gtr-faixa">
        <span className="gtr-trilho" aria-hidden="true">
          <span className="gtr-traco" />
        </span>
        <ol className="gtr-passos">
          {troca.passos.map((passo) => (
            <li key={passo.titulo} className="gtr-passo">
              <i className="gtr-no" aria-hidden="true" />
              <h3 className="gtr-passo-titulo">{passo.titulo}</h3>
              <p className="gtr-passo-texto">{passo.texto}</p>
            </li>
          ))}
        </ol>
        <div className="gtr-condominio">
          <Marcas />
          <Marcas feitas />
          <p className="gtr-linha-rotulo rotulo">{troca.linha}</p>
        </div>
      </div>
    </section>
  )
}
