import './papeis.css'
import { conteudo } from '@/site/conteudo/conteudo'

/**
 * Papéis do Garante: quem faz o quê (o condomínio, a Semog Garante, a equipe da Semog e o síndico),
 * numa fila ligada por um traço céu. Nasce no marinho em que o caixa terminou e desce ao branco das
 * dúvidas.
 */
export function Papeis() {
  const { papeis } = conteudo.garantePagina
  return (
    <section id="papeis" className="cena" data-tema="marinho" aria-labelledby="papeis-titulo">
      <div className="container gp-topo">
        <h2 id="papeis-titulo" className="gp-titulo">
          {papeis.titulo}
        </h2>
      </div>

      <div className="container gp-fila">
        <span className="gp-linha" aria-hidden="true" />
        <ol className="gp-lista">
          {papeis.itens.map((item) => (
            <li key={item.quem} className="gp-papel">
              <i className="gp-no" aria-hidden="true" />
              <h3 className="gp-quem">{item.quem}</h3>
              <p className="gp-faz">{item.faz}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="gp-descida" aria-hidden="true" />
    </section>
  )
}
