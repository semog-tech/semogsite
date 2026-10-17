import './duvidas.css'
import { conteudo } from '@/site/conteudo/conteudo'

/**
 * Dúvidas do Garante: o que o síndico pergunta antes de levar o produto à assembleia, cada uma num
 * `<details>` (sem JS tudo funciona; a primeira vem aberta). A outra dúvida segue pelo pedido de
 * proposta, sem WhatsApp. Na saída, a coluna lavanda sobe e vira o véu do convite da proposta.
 */
export function DuvidasDoGarante() {
  const { duvidas } = conteudo.garantePagina
  return (
    <section
      id="duvidas-garante"
      className="cena"
      data-tema="claro"
      aria-labelledby="duvidas-garante-titulo"
    >
      <div className="container gd-quadro">
        <div className="gd-cabeca">
          <h2 id="duvidas-garante-titulo" className="gd-titulo">
            {duvidas.titulo}
          </h2>
          <div className="gd-outra">
            <p className="rotulo">{duvidas.outra}</p>
            <a className="link-seta" href="#proposta">
              {/* TEXTO-NOVO: escrito direto na parcial do protótipo (04-duvidas.html). */}
              <span>Pergunte no pedido de proposta</span>
              <svg className="seta" aria-hidden="true">
                <use href="#seta" />
              </svg>
            </a>
          </div>
        </div>

        <div className="gd-lista">
          {duvidas.itens.map((item, i) => (
            <details key={item.pergunta} className="gd-item" open={i === 0}>
              <summary className="gd-pergunta">
                <span>{item.pergunta}</span>
                <i aria-hidden="true" />
              </summary>
              <div className="gd-resposta">
                <p>{item.resposta}</p>
              </div>
            </details>
          ))}
        </div>
      </div>

      <div className="gd-saida" aria-hidden="true">
        <span className="gd-veu" />
      </div>
    </section>
  )
}
