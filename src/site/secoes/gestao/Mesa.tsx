import './mesa.css'
import { conteudo } from '@/site/conteudo/conteudo'

/** A ordem misturada das tarefas na pilha da mesa (o `data-tarefa` de cada vaga no protótipo). */
const ORDEM_DA_PILHA = [0, 7, 12, 4, 13, 1, 10, 8, 5, 3, 14, 9, 6, 11, 2] as const

type Tarefa = { indice: number; texto: string }

/** As tarefas de cada frente, numeradas em sequência pela ordem das frentes (o `data-tarefa`). */
function tarefasPorFrente(): Tarefa[][] {
  let indice = 0
  return conteudo.gestaoPagina.mesa.frentes.map((frente) =>
    frente.tarefas.map((texto) => {
      const tarefa = { indice, texto }
      indice += 1
      return tarefa
    }),
  )
}

function tarefaDaPilha(tarefas: Tarefa[], indice: number): Tarefa {
  const tarefa = tarefas.find((t) => t.indice === indice)
  if (!tarefa) throw new Error(`[mesa-do-sindico] tarefa ${indice} fora das frentes.`)
  return tarefa
}

/** A mesa (a pilha misturada e "decidir") e as cinco frentes da Semog com as tarefas no lugar. */
function Figura() {
  const { mesa } = conteudo.gestaoPagina
  const frentes = tarefasPorFrente()
  const todas = frentes.flat()
  return (
    <figure className="gme-figura" aria-hidden="true">
      <div className="gme-mesa">
        <p className="gme-rotulo rotulo">{mesa.mesaRotulo}</p>
        <ul className="gme-pilha">
          {ORDEM_DA_PILHA.map((indice) => (
            <li key={indice} className="gme-vaga" data-tarefa={indice}>
              <span>{tarefaDaPilha(todas, indice).texto}</span>
            </li>
          ))}
          <li className="gme-decidir">
            <span className="gme-realce" />
            <span className="gme-decidir-texto">{mesa.decidir}</span>
          </li>
        </ul>
      </div>
      <div className="gme-frentes">
        <p className="gme-rotulo rotulo">{mesa.frentesRotulo}</p>
        <span className="gme-espinha">
          <span className="gme-traco" />
        </span>
        {mesa.frentes.map((frente, i) => (
          <div key={frente.nome} className="gme-frente">
            <i className="gme-no" />
            <p className="gme-frente-nome">{frente.nome}</p>
            <ul className="gme-cartoes">
              {(frentes[i] ?? []).map((tarefa) => (
                <li key={tarefa.indice} className="gme-cartao" data-tarefa={tarefa.indice}>
                  {tarefa.texto}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </figure>
  )
}

/**
 * Mesa do síndico, a cena-assinatura da Gestão. Sem JS, os sete momentos e o desenho no estado
 * final; com JS, o palco fixa e a rolagem leva as tarefas da mesa às frentes da Semog, até sobrar
 * "decidir", que cresce até virar o céu claro da cena seguinte.
 */
export function MesaDoSindico() {
  const { mesa } = conteudo.gestaoPagina
  return (
    <section
      id="mesa-do-sindico"
      className="cena"
      data-tema="claro"
      aria-labelledby="mesa-do-sindico-titulo"
    >
      <div className="gme-palco">
        <div className="container gme-grade">
          <h2 id="mesa-do-sindico-titulo" className="gme-titulo">
            {mesa.titulo}
          </h2>

          <ol className="gme-momentos">
            {mesa.momentos.map((momento) => (
              <li key={momento.titulo} className="gme-momento">
                <h3 className="gme-momento-titulo">
                  <span className="gme-in">{momento.titulo}</span>
                </h3>
                <p className="gme-texto">
                  <span className="gme-in">{momento.texto}</span>
                </p>
              </li>
            ))}
          </ol>

          <Figura />
        </div>
        <div className="gme-cobertura" aria-hidden="true" />
      </div>
    </section>
  )
}
