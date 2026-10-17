import './pedido.css'
import { conteudo } from '@/site/conteudo/conteudo'
import { comIndice } from '@/site/estilo'
import { FormularioProposta } from '@/site/formularios/proposta/FormularioProposta'

/**
 * Pedido da página de proposta, para onde levam "Seja Semog" e "Pedir proposta" vindos de fora: o
 * formulário em duas etapas na dobra, num painel gelo, ao lado do título, e por que pedir agora
 * logo abaixo. Entrada só de CSS, desde a primeira pintura.
 */
export function PedidoDeProposta() {
  const { propostaPagina, numeros, ranking, pilares, landing } = conteudo
  return (
    <section id="proposta" className="pp" data-tema="claro" aria-labelledby="pp-titulo">
      <div className="container pp-quadro">
        <div className="pp-intro">
          <h1 id="pp-titulo" className="pp-titulo">
            <span className="linha">
              <span className="linha-interna" style={comIndice(0)}>
                {propostaPagina.titulo}
              </span>
            </span>{' '}
            <span className="linha">
              <span className="linha-interna" style={comIndice(1)}>
                <em className="peso peso-fixo" data-texto={propostaPagina.enfase}>
                  {propostaPagina.enfase}
                </em>
              </span>
            </span>
          </h1>
          <p className="pp-sub">{propostaPagina.sub}</p>
        </div>

        <div className="pp-painel">
          <FormularioProposta id="pp" classe="pp-form" />
        </div>

        <div className="pp-porque">
          <h2 className="pp-porque-titulo">{propostaPagina.porque.titulo}</h2>
          <ul className="pp-fatos">
            <li style={comIndice(0)}>
              <strong>{numeros.anos.valor} anos</strong>
              <span>{propostaPagina.porque.anos}</span>
            </li>
            <li style={comIndice(1)}>
              <strong>{ranking.titulo}</strong>
              <span>{landing.prova.rankingApoio}</span>
            </li>
            <li style={comIndice(2)}>
              <strong>{pilares.itens[1].titulo}</strong>
              <span>{propostaPagina.porque.garante}</span>
            </li>
            <li style={comIndice(3)}>
              <strong>{propostaPagina.porque.prestacao.destaque}</strong>
              <span>{propostaPagina.porque.prestacao.texto}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
