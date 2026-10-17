import './atende.css'
import { conteudo } from '@/site/conteudo/conteudo'
import { caminhoNoSite } from '@/site/rotas'

/** Destino do link de cada item, na ordem do conteúdo (os dois últimos não têm link). */
const LINKS_DOS_ITENS = ['/tecnologia', '/#unidades'] as const
/** Destino de cada caminho de "Vá além da gestão", na ordem do conteúdo. */
const LINKS_DO_ALEM = ['/garante', '/tecnologia', '/incorporadoras'] as const

function destinoDoAlem(i: number): string {
  const destino = LINKS_DO_ALEM[i]
  if (!destino) throw new Error(`[quem-atende] caminho ${i} sem destino.`)
  return destino
}

function Seta() {
  return (
    <svg className="seta" aria-hidden="true">
      <use href="#seta" />
    </svg>
  )
}

/** O que fica perto do síndico além das frentes, cada item com o seu nó. */
function Itens() {
  return (
    <ul className="gat-itens">
      {conteudo.gestaoPagina.atende.itens.map((item, i) => {
        const destino = LINKS_DOS_ITENS[i]
        return (
          <li key={item.titulo} className="gat-item">
            <i aria-hidden="true" />
            <h3 className="gat-item-titulo">{item.titulo}</h3>
            <p className="gat-item-texto">{item.texto}</p>
            {'link' in item && destino ? (
              <a className="link-seta" href={caminhoNoSite(destino)}>
                <span>{item.link}</span>
                <Seta />
              </a>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Quem atende, no céu claro em que "decidir" cobriu a tela: o título com "e de quem decide." em
 * peso, o lead, os tipos de condomínio e o que fica perto do síndico; embaixo, três caminhos para
 * ir além da gestão.
 */
export function QuemAtende() {
  const { atende } = conteudo.gestaoPagina
  return (
    <section
      id="quem-atende"
      className="cena"
      data-tema="gelo"
      aria-labelledby="quem-atende-titulo"
    >
      <div className="container gat-quadro">
        <div className="gat-cabeca">
          <h2 id="quem-atende-titulo" className="gat-titulo">
            {atende.tituloA} <em className="peso">{atende.tituloB}</em>
          </h2>
          <p className="gat-lead lead">{atende.lead}</p>
          <p className="gat-tipos rotulo">{atende.tipos}</p>
        </div>

        <Itens />
      </div>

      <nav className="container gat-alem" aria-labelledby="quem-atende-alem">
        <p id="quem-atende-alem" className="gat-alem-rotulo rotulo">
          {atende.alemRotulo}
        </p>
        <ul className="gat-links">
          {atende.alem.map((caminho, i) => (
            <li key={caminho.titulo}>
              <a className="gat-link" href={caminhoNoSite(destinoDoAlem(i))}>
                <span className="gat-link-titulo">{caminho.titulo}</span>
                <span className="gat-link-texto">{caminho.texto}</span>
                <Seta />
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="gat-descida" aria-hidden="true" />
    </section>
  )
}
