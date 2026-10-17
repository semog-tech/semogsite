import './assembleia.css'
import { conteudo } from '@/site/conteudo/conteudo'

type ItemDaPauta = (typeof conteudo.aSemog.assembleia.itens)[number]

function Item({ item }: { item: ItemDaPauta }) {
  return (
    <li className="as-item">
      <svg className="as-check" viewBox="0 0 21 21" aria-hidden="true" focusable="false">
        <rect className="as-check-caixa" x="0.75" y="0.75" width="19.5" height="19.5" />
        <path className="as-check-marca" d="M5 10.5l4 4 7.5-8" />
      </svg>
      <p className="as-pergunta">{item.pergunta}</p>
      <div className="as-resposta">
        <p className="as-dado num">{item.dado}</p>
        <p className="as-afirmacao">{item.resposta}</p>
        <p className="as-apoio">{item.apoio}</p>
      </div>
    </li>
  )
}

/**
 * Assembleia (A Semog): a pauta que o conselheiro leva, com seis perguntas para fazer a qualquer
 * administradora e, ao lado, o que a Semog responde. Na saída, a coluna lavanda sobe e vira o véu
 * do pedido de proposta.
 */
export function Assembleia() {
  const { assembleia } = conteudo.aSemog
  return (
    <section id="assembleia" className="cena" data-tema="gelo" aria-labelledby="assembleia-titulo">
      <div className="container">
        <article className="as-folha">
          <header className="as-cabeca">
            {/* TEXTO-NOVO */}
            <p className="as-rotulo rotulo">{assembleia.rotulo}</p>
            <h2 id="assembleia-titulo" className="as-titulo">
              {assembleia.tituloA} <em className="peso">{assembleia.tituloB}</em>
            </h2>
            <p className="as-lead">{assembleia.lead}</p>
          </header>
          <div className="as-colunas rotulo" aria-hidden="true">
            <span>{assembleia.colunaPergunta}</span>
            <span>{assembleia.colunaResposta}</span>
          </div>
          <div className="as-lista">
            <div className="as-fio" aria-hidden="true">
              <span className="as-fio-traco" />
            </div>
            <ol className="as-itens">
              {assembleia.itens.map((item) => (
                <Item key={item.pergunta} item={item} />
              ))}
            </ol>
          </div>
        </article>
      </div>

      <div className="as-saida" aria-hidden="true">
        <span className="as-veu" />
      </div>
    </section>
  )
}
