import './depois.css'
import { conteudo } from '@/site/conteudo/conteudo'
import { comIndice } from '@/site/estilo'
import { caminhoNoSite } from '@/site/rotas'

/**
 * Depois do pedido: os três passos, ligados por um traço só, de ponta reta, que se desenha quando
 * a seção chega à tela; os passos 2 e 3 são os da troca de administradora das landings. Para quem
 * prefere telefone, o caminho para o contato.
 */
export function DepoisDoPedido() {
  const { depois } = conteudo.propostaPagina
  const { passos } = conteudo.landing.troca
  return (
    <section id="proposta-depois" className="cena pd" data-tema="gelo" aria-labelledby="pd-titulo">
      <div className="container">
        <h2 id="pd-titulo" className="pd-titulo revelar">
          <span className="linha">
            <span className="linha-interna">
              {depois.titulo}{' '}
              <em className="peso peso-fixo" data-texto={depois.enfase}>
                {depois.enfase}
              </em>
            </span>
          </span>
        </h2>
        <ol className="pd-passos revelar revelar--bloco">
          <li style={comIndice(0)}>
            <h3>{depois.primeiroPasso}</h3>
            <p>{passos[0].texto}</p>
          </li>
          <li style={comIndice(1)}>
            <h3>{passos[1].titulo}</h3>
            <p>{passos[1].texto}</p>
          </li>
          <li style={comIndice(2)}>
            <h3>{passos[2].titulo}</h3>
            <p>{passos[2].texto}</p>
          </li>
        </ol>
        <p className="pd-contato revelar revelar--bloco">
          <span>{depois.contato}</span>
          <a className="link-seta" href={caminhoNoSite('/contato')}>
            <span>{depois.contatoLink}</span>
            <svg className="seta" aria-hidden="true">
              <use href="#seta" />
            </svg>
          </a>
        </p>
      </div>
    </section>
  )
}
