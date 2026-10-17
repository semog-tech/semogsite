import './percurso.css'
import { conteudo } from '@/site/conteudo/conteudo'
import { comVariaveis } from '@/site/estilo'

/**
 * O desenho de cada passo, num traço só de ponta reta: a planta, a convenção, a mesa da
 * assembleia, o prédio e a chave, a régua do pós-obra. Cada um sai do chão (y 300) e volta a ele;
 * o trilho lavanda é a soma dos cinco.
 */
const TRACOS = [
  'M0 300H150V90H300V175V90H450V200H370H450V300H550',
  'M550 300H650V140H800H650V180H820H650V220H760H650V80H840V140H900V300H1050',
  'M1050 300H1140V130H1175V104H1205V130H1250V104H1280V130H1325V104H1355V130H1400V104H1430V130H1460V165H1486V195H1460V230H1430V256H1400V230H1355V256H1325V230H1280V256H1250V230H1205V256H1175V230H1140V300H1550',
  'M1550 300H1680V268H1716V300H1610V80H1800V124H1610H1800V168H1610H1800V212H1610H1800V256H1610H1800V300H1870V195H1920V245H1870H1920V220H1975V238H1990V220H2010V300H2050',
  'M2050 300H2100V180H2250V300H2200V280V300H2150V280V300H2250H2300V280V300H2350V280V300H2400V250V300H2450V280V300H2600',
] as const

/** Posição de cada passo no eixo, de 0 a 1. */
const POSICOES_NO_EIXO = [0, 0.25, 0.5, 0.75, 1] as const

/**
 * Percurso, a cena-assinatura de Incorporadoras: da planta às chaves. Sem JS é a lista dos cinco
 * passos com o desenho inteiro; com JS, o palco fica fixo e a rolagem percorre o desenho, passo a
 * passo. No pós-obra, a garantia e a manutenção ficam anotadas, cada uma no seu lugar.
 */
export function Percurso() {
  const { percurso } = conteudo.incorporadoras
  return (
    <section id="percurso" className="cena" data-tema="claro" aria-labelledby="percurso-titulo">
      <div className="pc-palco">
        <div className="container pc-grade">
          <h2 id="percurso-titulo" className="pc-titulo">
            {percurso.titulo}
          </h2>

          <ol className="pc-passos">
            {percurso.passos.map((passo) => (
              <li key={passo.rotulo} className="pc-passo">
                <h3 className="pc-passo-titulo">
                  <span className="pc-in">{passo.titulo}</span>
                </h3>
                <p className="pc-passo-texto">
                  <span className="pc-in">{passo.texto}</span>
                </p>
                <p className="pc-passo-apoio rotulo">
                  <span className="pc-in">{passo.apoio}</span>
                </p>
              </li>
            ))}
          </ol>

          <figure className="pc-desenho">
            <div className="pc-janela">
              <svg
                className="pc-faixa"
                viewBox="0 60 2600 260"
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
                focusable="false"
              >
                <path className="pc-trilho percurso" pathLength={1} d={TRACOS.join('')} />
                {TRACOS.map((d, i) => (
                  <path key={d} className="pc-traco percurso" data-passo={i} pathLength={1} d={d} />
                ))}
                <text className="pc-anotacao" data-passo="4" x="2175" y="166" textAnchor="middle">
                  {percurso.desenho.garantia}
                </text>
                <text className="pc-anotacao" data-passo="4" x="2375" y="238" textAnchor="middle">
                  {percurso.desenho.manutencao}
                </text>
              </svg>
            </div>
            <figcaption className="pc-esquema rotulo">
              <span>{percurso.esquema}</span>
            </figcaption>
          </figure>

          <div className="pc-eixo" aria-hidden="true">
            <div className="pc-eixo-linha">
              <span className="pc-eixo-trilho" />
              <span className="pc-eixo-traco" />
            </div>
            <ol className="pc-ticks">
              {percurso.passos.map((passo, i) => (
                <li key={passo.rotulo} style={comVariaveis({ '--x': POSICOES_NO_EIXO[i] ?? 0 })}>
                  <i />
                  <span>{passo.rotulo}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="pc-cobertura" aria-hidden="true">
          <span className="pc-cobertura-mare" />
        </div>
      </div>
    </section>
  )
}
