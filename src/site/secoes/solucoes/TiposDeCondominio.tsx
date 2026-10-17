import './tipos.css'
import { conteudo } from '@/site/conteudo/conteudo'

/** Soluções · os três tipos atendidos (residenciais, comerciais, associações), com as âncoras de hoje. */
export function TiposDeCondominio() {
  return (
    <section
      id="tipos-de-condominio"
      className="cena sl-tipos"
      data-tema="gelo"
      aria-label="Tipos de condomínio atendidos"
    >
      <div className="container">
        {conteudo.solucoesPagina.tipos.map((tipo) => (
          <article
            key={tipo.id}
            id={tipo.id}
            className="sl-tipo"
            aria-labelledby={`${tipo.id}-titulo`}
          >
            <p className="rotulo">{tipo.rotulo}</p>
            <div>
              <h2 id={`${tipo.id}-titulo`} className="sl-tipo-titulo">
                {tipo.titulo}
              </h2>
              <p className="sl-tipo-texto">{tipo.texto}</p>
              {tipo.itens.length > 0 ? (
                <ul className="sl-itens">
                  {tipo.itens.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
