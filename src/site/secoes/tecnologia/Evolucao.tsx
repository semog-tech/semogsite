import './evolucao.css'
import { conteudo } from '@/site/conteudo/conteudo'

/**
 * Evolução, o mês seguinte: nasce no marinho em que as casas do mês seguinte se abriram, com quem
 * faz a Semog One; embaixo, a linha das semanas até esta semana e, daí em diante, o tracejado do
 * que está em desenvolvimento, sem data.
 */
export function Evolucao() {
  const { evolucao } = conteudo.tecnologia.pagina
  return (
    <section id="evolucao" className="cena" data-tema="marinho" aria-labelledby="evolucao-titulo">
      <div className="container ev-topo" data-tema="marinho">
        <h2 id="evolucao-titulo" className="ev-titulo">
          {evolucao.tituloA} <em className="peso">{evolucao.tituloB}</em>
        </h2>
        <p className="ev-texto">{evolucao.texto}</p>
      </div>

      <figure className="ev-semanas" data-tema="marinho">
        <div className="ev-linha" aria-hidden="true">
          <span className="ev-feito" />
          <span className="ev-proxima" />
          <span className="ev-agora" />
          <span className="ev-rotulo-agora rotulo">
            <span className="ev-in">{evolucao.agora}</span>
          </span>
        </div>
        <figcaption className="ev-legendas">
          <span className="ev-esquema rotulo">
            <span className="ev-in">{evolucao.esquema}</span>
          </span>
          <span className="ev-rotulo-proxima rotulo">
            <span className="ev-in">{evolucao.proxima}</span>
          </span>
        </figcaption>
      </figure>

      <div className="ev-descida" aria-hidden="true" />
    </section>
  )
}
