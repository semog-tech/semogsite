import './abertura.css'
import { GatilhoSouCliente } from '@/site/cliente/GatilhoSouCliente'
import { conteudo } from '@/site/conteudo/conteudo'
import { comIndice } from '@/site/estilo'
import { caminhoNoSite } from '@/site/rotas'

/**
 * Abertura do Contato, para quem não quer proposta (condômino, fornecedor, imprensa, trabalhe
 * conosco): título, frase e quatro atalhos. A 2ª via abre direto a consulta do "Sou cliente".
 */
export function AberturaDoContato() {
  const { contatoPagina, marca } = conteudo
  const { atalhos } = contatoPagina
  return (
    <section id="contato-abertura" className="ct" data-tema="claro" aria-labelledby="ct-titulo">
      <div className="container">
        <h1 id="ct-titulo" className="ct-titulo">
          <span className="linha">
            <span className="linha-interna" style={comIndice(0)}>
              {contatoPagina.titulo}{' '}
              <em className="peso peso-fixo" data-texto={contatoPagina.enfase}>
                {contatoPagina.enfase}
              </em>
            </span>
          </span>
        </h1>
        <p className="ct-sub">{contatoPagina.sub}</p>

        <ul className="ct-atalhos">
          <li style={comIndice(0)}>
            <a className="ct-atalho" href={caminhoNoSite('/proposta')}>
              <strong>{atalhos.proposta.titulo}</strong>
              <span>{atalhos.proposta.texto}</span>
              <svg className="seta" aria-hidden="true">
                <use href="#seta" />
              </svg>
            </a>
          </li>
          <li style={comIndice(1)}>
            <GatilhoSouCliente origem="contato" tela="segunda-via" className="ct-atalho">
              <strong>{atalhos.segundaVia.titulo}</strong>
              <span>{atalhos.segundaVia.texto}</span>
              <svg className="seta" aria-hidden="true">
                <use href="#seta" />
              </svg>
            </GatilhoSouCliente>
          </li>
          <li style={comIndice(2)}>
            <a className="ct-atalho" href={marca.loginUrl}>
              <strong>{atalhos.login.titulo}</strong>
              <span>{atalhos.login.texto}</span>
              <svg className="seta" aria-hidden="true">
                <use href="#seta" />
              </svg>
            </a>
          </li>
          <li style={comIndice(3)}>
            <a className="ct-atalho" href="#contato-mensagem">
              <strong>{atalhos.mensagem.titulo}</strong>
              <span>{atalhos.mensagem.texto}</span>
              <svg className="seta ct-seta-baixo" aria-hidden="true">
                <use href="#seta" />
              </svg>
            </a>
          </li>
        </ul>
      </div>
    </section>
  )
}
