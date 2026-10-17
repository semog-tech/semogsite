import './convivencia.css'
import { conteudo } from '@/site/conteudo/conteudo'

/**
 * Convivência: o porquê, antes do como. A frase da casa com a convivência em peso; embaixo, o
 * argumento dos primeiros doze meses e as três reclamações que mais pesam contra a incorporadora,
 * cada uma ligada por um traço ao passo do percurso que cuida dela.
 */
export function Convivencia() {
  const { convivencia } = conteudo.incorporadoras
  return (
    <section
      id="convivencia"
      className="cena"
      data-tema="claro"
      aria-labelledby="convivencia-titulo"
    >
      <div className="container cv-quadro">
        <h2 id="convivencia-titulo" className="cv-titulo">
          {convivencia.tituloA} <em className="peso">{convivencia.tituloB}</em>
        </h2>
        <div className="cv-corpo">
          <div className="cv-argumento">
            <p className="cv-texto">{convivencia.texto}</p>
            <p className="cv-apoio">{convivencia.apoio}</p>
          </div>
          <div className="cv-riscos">
            <h3 className="cv-riscos-titulo rotulo">{convivencia.riscosTitulo}</h3>
            <ul className="cv-lista">
              {convivencia.riscos.map((item) => (
                <li key={item.risco} className="cv-risco">
                  <span className="cv-de">{item.risco}</span>
                  <span className="cv-traco" aria-hidden="true">
                    <i />
                    <b />
                  </span>
                  <a className="cv-para" href="#percurso">
                    {item.resposta}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
