import './perguntas.css'
import { conteudo } from '@/site/conteudo/conteudo'

/**
 * Perguntas da Gestão: o que o síndico pergunta a uma administradora, cada uma num `<details>`
 * (sem JS tudo funciona; a primeira vem aberta). A outra dúvida segue pelo pedido de proposta, sem
 * WhatsApp. Na saída, a coluna lavanda sobe e vira o véu do convite da proposta.
 */
export function PerguntasDaGestao() {
  const { perguntas } = conteudo.gestaoPagina
  return (
    <section
      id="perguntas-gestao"
      className="cena"
      data-tema="claro"
      aria-labelledby="perguntas-gestao-titulo"
    >
      <div className="container gpf-quadro">
        <div className="gpf-cabeca">
          <h2 id="perguntas-gestao-titulo" className="gpf-titulo">
            {perguntas.titulo}
          </h2>
          <div className="gpf-outra">
            <p className="rotulo">{perguntas.outra}</p>
            <a className="link-seta" href="#proposta">
              <span>{perguntas.link}</span>
              <svg className="seta" aria-hidden="true">
                <use href="#seta" />
              </svg>
            </a>
          </div>
        </div>

        <div className="gpf-lista">
          {perguntas.itens.map((item, i) => (
            <details key={item.pergunta} className="gpf-item" open={i === 0}>
              <summary className="gpf-pergunta">
                <span>{item.pergunta}</span>
                <i aria-hidden="true" />
              </summary>
              <div className="gpf-resposta">
                <p>{item.resposta}</p>
              </div>
            </details>
          ))}
        </div>
      </div>

      <div className="gpf-saida" aria-hidden="true">
        <span className="gpf-veu" />
      </div>
    </section>
  )
}
