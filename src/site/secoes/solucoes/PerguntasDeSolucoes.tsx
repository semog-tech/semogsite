import './perguntas.css'
import { conteudo } from '@/site/conteudo/conteudo'

/** Soluções · perguntas frequentes, abertas por clique (details/summary: funciona sem JS). */
export function PerguntasDeSolucoes() {
  const { perguntas } = conteudo.solucoesPagina
  return (
    <section
      id="perguntas-solucoes"
      className="cena sl-perguntas"
      data-tema="claro"
      aria-labelledby="sl-perguntas-titulo"
    >
      <div className="container">
        <h2 id="sl-perguntas-titulo" className="sl-perguntas-titulo">
          {perguntas.titulo}
        </h2>
        {perguntas.itens.map((item) => (
          <details key={item.pergunta}>
            <summary>{item.pergunta}</summary>
            <p className="sl-resposta">{item.resposta}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
