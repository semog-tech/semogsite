import './abertura.css'
import './abertura-pendencia.css'
import type { ReactNode } from 'react'
import { conteudo, type NumerosDaPrestacao } from '@/site/conteudo/conteudo'
import { estaPendente, type OuPendente } from '@/site/conteudo/pendencias'
import { formatarNumero } from '@/site/formatar'
import { Pendencia } from '@/site/secoes/comum/Pendencia'

type Numero = { chave: string; rotulo: string; valor: ReactNode; ritmo?: boolean }

/**
 * Os três números da abertura. Os dois primeiros são os da nova prestação: com o dado do Leandro,
 * contam ao entrar (data-conta; o HTML já traz o valor final, no formato da contagem) e o rótulo do primeiro diz a data de corte; até lá, o selo fica no
 * lugar do valor, sem data-conta, e a cena não conta nada. O terceiro é o ritmo, que não muda.
 */
function numerosDaAbertura(numeros: OuPendente<NumerosDaPrestacao>): Numero[] {
  const { prestacoes, condominios, semana } = conteudo.tecnologia.pagina.abertura.numeros
  const ritmo: Numero = {
    chave: 'semana',
    rotulo: semana.rotulo,
    valor: <span className="so-in">{semana.valor}</span>,
    ritmo: true,
  }
  if (estaPendente(numeros)) {
    const selo = (
      <span className="so-in">
        <Pendencia item={numeros} />
      </span>
    )
    return [
      { chave: 'prestacoes', rotulo: prestacoes.rotulo, valor: selo },
      { chave: 'condominios', rotulo: condominios.rotulo, valor: selo },
      ritmo,
    ]
  }
  return [
    {
      chave: 'prestacoes',
      rotulo: `${prestacoes.rotulo}, até ${numeros.corte}`,
      valor: (
        <span className="so-in" data-conta={numeros.prestacoes} data-prefixo={prestacoes.prefixo}>
          {prestacoes.prefixo}
          {formatarNumero(numeros.prestacoes)}
        </span>
      ),
    },
    {
      chave: 'condominios',
      rotulo: condominios.rotulo,
      valor: (
        <span className="so-in" data-conta={numeros.condominios}>
          {formatarNumero(numeros.condominios)}
        </span>
      ),
    },
    ritmo,
  ]
}

/**
 * Abertura da Tecnologia: o nome da plataforma com "One." em peso e, ao lado, os três números que
 * a sustentam. No pé da dobra, a régua de um mês, que antecipa a cena seguinte.
 */
export function AberturaDaTecnologia() {
  const { abertura } = conteudo.tecnologia.pagina
  return (
    <section id="semog-one" className="cena" data-tema="claro" aria-labelledby="semog-one-titulo">
      <div className="container so-quadro">
        <div className="so-texto">
          <h1 id="semog-one-titulo" className="so-titulo entrada">
            {abertura.antes} <em className="peso">{abertura.enfase}</em>
          </h1>
          <p className="so-lead lead entrada">{abertura.lead}</p>
          <div className="so-acoes entrada">
            <a className="botao" href="#proposta">
              {abertura.botao}
              <svg className="seta" aria-hidden="true">
                <use href="#seta" />
              </svg>
            </a>
            <a className="link-seta" href="#mes">
              <span>{abertura.mes}</span>
              <svg className="seta" aria-hidden="true">
                <use href="#seta" />
              </svg>
            </a>
          </div>
        </div>

        <dl className="so-numeros">
          {numerosDaAbertura(conteudo.tecnologia.numerosDaPrestacao).map((numero) => (
            <div
              key={numero.chave}
              className={numero.ritmo ? 'so-numero so-numero--ritmo entrada' : 'so-numero entrada'}
            >
              <dt className="rotulo">
                <span className="so-mascara">
                  <span className="so-in">{numero.rotulo}</span>
                </span>
              </dt>
              <dd className="num">
                <span className="so-mascara">{numero.valor}</span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="so-mes" aria-hidden="true">
          <p className="so-mes-rotulo rotulo">
            <span className="so-mascara">
              <span className="so-in">{abertura.linha}</span>
            </span>
          </p>
          <div className="so-regua">
            <span className="so-regua-trilho" />
            <span className="so-regua-feito" />
          </div>
          <p className="so-regua-pontas rotulo">
            <span>1</span>
            <span>30</span>
          </p>
        </div>
      </div>
    </section>
  )
}
