import './mes.css'
import './mes-pendencia.css'
import { conteudo, type NumerosDaPrestacao } from '@/site/conteudo/conteudo'
import { estaPendente, type OuPendente } from '@/site/conteudo/pendencias'
import { comVariaveis } from '@/site/estilo'
import { Pendencia } from '@/site/secoes/comum/Pendencia'
import { CalendarioDoMes } from './CalendarioDoMes'
import { comChaves } from './chaves'
import { fraseDosNumerosDaPrestacao } from './numeros'

type Momento = (typeof conteudo.tecnologia.pagina.mes.momentos)[number]

/** O fim do mês fecha com o contexto da prestação digital e os números da nova (ou o selo). */
function ApoioDoFimDoMes({ numeros }: { numeros: OuPendente<NumerosDaPrestacao> }) {
  const { contexto } = conteudo.tecnologia
  return (
    <p className="ms-apoio rotulo">
      <span className="ms-in">
        {contexto}{' '}
        {estaPendente(numeros) ? <Pendencia item={numeros} /> : fraseDosNumerosDaPrestacao(numeros)}
      </span>
    </p>
  )
}

function MomentoDoMes({ momento, ultimo }: { momento: Momento; ultimo: boolean }) {
  return (
    <li className="ms-momento">
      <p className="ms-quando">
        <span className="ms-in">{momento.quando}</span>
      </p>
      <h3 className="ms-momento-titulo">
        <span className="ms-in">{momento.titulo}</span>
      </h3>
      <p className="ms-texto">
        <span className="ms-in">{momento.texto}</span>
      </p>
      <div className="ms-fluxo-mascara">
        <div className="ms-fluxo ms-in" style={comVariaveis({ '--n': momento.fluxo.length })}>
          <span className="ms-fluxo-linha" aria-hidden="true" />
          <ol className="ms-fluxo-passos">
            {comChaves(momento.fluxo).map((passo) => (
              <li key={passo.chave}>
                <i aria-hidden="true" />
                <span>{passo.valor}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      {'apoio' in momento ? (
        <p className="ms-apoio rotulo">
          <span className="ms-in">{momento.apoio}</span>
        </p>
      ) : null}
      {ultimo ? <ApoioDoFimDoMes numeros={conteudo.tecnologia.numerosDaPrestacao} /> : null}
    </li>
  )
}

/**
 * Um mês de condomínio, a cena-assinatura da Tecnologia. Sem JS, é a lista dos seis momentos e o
 * calendário inteiro, com o mês já percorrido; com JS, o palco fica fixo e a rolagem atravessa o mês
 * num traço só, da convenção às casas do mês seguinte, que viram a cena seguinte.
 */
export function UmMesDeCondominio() {
  const { mes } = conteudo.tecnologia.pagina
  return (
    <section id="mes" className="cena" data-tema="claro" aria-labelledby="mes-titulo">
      <div className="ms-palco">
        <div className="container ms-grade">
          <h2 id="mes-titulo" className="ms-titulo">
            {mes.titulo}
          </h2>

          <ol className="ms-momentos">
            {mes.momentos.map((momento, i) => (
              <MomentoDoMes
                key={momento.quando}
                momento={momento}
                ultimo={i === mes.momentos.length - 1}
              />
            ))}
          </ol>

          <figure className="ms-folha">
            <div className="ms-janela">
              <CalendarioDoMes />
            </div>
            <figcaption className="ms-legenda rotulo">
              <span>{mes.legenda}</span>
            </figcaption>
          </figure>
        </div>
        <div className="ms-cobertura" aria-hidden="true" />
      </div>
    </section>
  )
}
