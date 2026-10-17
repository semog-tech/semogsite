import './caixa.css'
import { conteudo } from '@/site/conteudo/conteudo'

/**
 * Topo da parte paga pelos condôminos em cada mês (y no SVG, de jan a dez), os valores
 * ilustrativos do protótipo (a legenda diz que são fictícios). O resto sai da geometria: a base
 * fica em 308, o patamar dos 100% em 48 e a dívida, na faixa da cobrança, tem a altura do que
 * ficou em aberto menos o contorno.
 */
const TOPO_DO_PAGO = [63.6, 84.4, 71.4, 102.6, 79.2, 92.2, 68.8, 110.4, 76.6, 87, 97.4, 74] as const
const BASE = 308
const PATAMAR = 48
const PASSO_MES = 56

/** Uma casa decimal, como no SVG do protótipo (308 - 63.6 em ponto flutuante não é 244.4). */
function umaCasa(v: number): number {
  return Math.round(v * 10) / 10
}

function Mes({ indice, rotulo }: { indice: number; rotulo: string }) {
  const topo = TOPO_DO_PAGO[indice]
  if (topo === undefined) throw new Error(`[caixa-do-condominio] mês ${indice} sem valor.`)
  const x = indice * PASSO_MES
  const emAberto = umaCasa(topo - PATAMAR)
  return (
    <g className="gc-mes">
      <rect className="gc-pago" x={x} y={topo} width={36} height={umaCasa(BASE - topo)} />
      <rect className="gc-coberto" x={x} y={PATAMAR} width={36} height={emAberto} />
      <rect
        className="gc-aberto"
        x={x + 0.75}
        y={410.75}
        width={34.5}
        height={umaCasa(emAberto - 1.5)}
      />
      <text className="gc-mes-rotulo" x={x + 18} y={334}>
        {rotulo}
      </text>
    </g>
  )
}

/** O ano de caixa: patamar previsto, os doze meses, o 1% e a faixa da cobrança. */
function Grafico() {
  const { caixa } = conteudo.garantePagina
  return (
    <svg className="gc-grafico" viewBox="0 0 700 540" aria-hidden="true" focusable="false">
      <rect className="gc-area" x={0} y={48} width={652} height={260} />
      <path className="gc-base" d="M0 308.5H652" />
      <path className="gc-previsto" d="M0 48H652C688 48 688 410 652 410H0" pathLength={1} />
      <text className="gc-rotulo" x={0} y={30}>
        {caixa.previsto}
      </text>
      {caixa.meses.map((mes, i) => (
        <Mes key={mes} indice={i} rotulo={mes} />
      ))}
      <rect className="gc-custo" x={0} y={49.3} width={652} height={2.6} />
      <g className="gc-custo-rotulo">
        <path d="M634 36V46.5" />
        <text x={652} y={30}>
          {caixa.custo}
        </text>
      </g>
      <path className="gc-traco" d="M0 48H652C688 48 688 410 652 410H0" pathLength={1} />
      <text className="gc-rotulo gc-rotulo-cobranca" x={0} y={506}>
        {caixa.cobrancaA}
      </text>
      <text className="gc-rotulo gc-rotulo-cobranca" x={0} y={530}>
        {caixa.cobrancaB}
      </text>
    </svg>
  )
}

/**
 * Caixa do condomínio, a cena-assinatura do Garante. Sem JS é a lista dos quatro momentos e o
 * gráfico no estado final: doze meses no patamar da arrecadação prevista, o que ficou em aberto
 * pago pela Semog Garante, as dívidas na faixa da cobrança e o 1% no topo. Os valores são
 * ilustrativos e a legenda diz isso.
 */
export function CaixaDoCondominio() {
  const { caixa } = conteudo.garantePagina
  return (
    <section
      id="caixa-do-condominio"
      className="cena"
      data-tema="claro"
      aria-labelledby="caixa-do-condominio-titulo"
    >
      <div className="gc-palco">
        <div className="container gc-grade">
          <h2 id="caixa-do-condominio-titulo" className="gc-titulo">
            {caixa.titulo}
          </h2>

          <ol className="gc-momentos">
            {caixa.momentos.map((momento) => (
              <li key={momento.titulo} className="gc-momento">
                <h3 className="gc-momento-titulo">
                  <span className="gc-in">{momento.titulo}</span>
                </h3>
                <p className="gc-texto">
                  <span className="gc-in">{momento.texto}</span>
                </p>
              </li>
            ))}
          </ol>

          <figure className="gc-figura">
            <div className="gc-janela">
              <Grafico />
            </div>
            <figcaption className="gc-legenda">
              <ul className="gc-chaves rotulo">
                <li className="gc-chave gc-chave--pago">
                  <i />
                  {caixa.pago}
                </li>
                <li className="gc-chave gc-chave--aberto">
                  <i />
                  {caixa.aberto}
                </li>
                <li className="gc-chave gc-chave--coberto">
                  <i />
                  {caixa.coberto}
                </li>
              </ul>
              <p className="gc-ilustracao rotulo">{caixa.ilustracao}</p>
            </figcaption>
          </figure>
        </div>
        <div className="gc-cobertura" aria-hidden="true" />
      </div>
    </section>
  )
}
