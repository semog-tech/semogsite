import './porque.css'
import { conteudo } from '@/site/conteudo/conteudo'

/** Soluções · o que muda com a Semog: cinco fatos, em blocos gelo de ponta reta. */
export function PorqueSemog() {
  const { porque } = conteudo.solucoesPagina
  return (
    <section
      id="porque-semog"
      className="cena sl-porque"
      data-tema="claro"
      aria-labelledby="sl-porque-titulo"
    >
      <div className="container">
        <h2 id="sl-porque-titulo" className="sl-porque-titulo">
          {porque.titulo}
        </h2>
        <ul className="sl-fatos">
          {porque.itens.map((item) => (
            <li key={item.titulo} className="sl-fato">
              {/* Sem número, a casa fica vazia: os títulos dos cinco blocos alinham na mesma linha. */}
              <span className="sl-fato-valor num" aria-hidden={item.valor ? undefined : true}>
                {item.valor}
              </span>
              <strong className="sl-fato-titulo">{item.titulo}</strong>
              <span>{item.texto}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
