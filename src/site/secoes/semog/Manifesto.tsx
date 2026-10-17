import './manifesto.css'
import { conteudo } from '@/site/conteudo/conteudo'

type Numero = { chave: string; rotulo: string; valor: number; prefixo?: string; sufixo?: string }

/** Os cinco números que sustentam a frase, na ordem do protótipo. */
function numerosDoManifesto(): Numero[] {
  const { numeros, aSemog } = conteudo
  const { colaboradores, estados } = aSemog.numeros
  return [
    {
      chave: 'anos',
      rotulo: `${numeros.anos.rotulo}, ${numeros.anos.detalhe}`,
      valor: numeros.anos.valor,
    },
    { chave: 'condominios', ...numeros.condominios },
    { chave: 'clientes', ...numeros.clientes },
    { chave: 'colaboradores', ...colaboradores },
    { chave: 'estados', rotulo: `${estados.rotulo}: ${estados.detalhe}`, valor: estados.valor },
  ]
}

/**
 * Manifesto (A Semog): a frase da casa em Saira leve e grande, no marinho, com "Esse trabalho é
 * nosso." em peso. Embaixo, já na luz, os cinco números que sustentam a frase, contando ao entrar.
 */
export function Manifesto() {
  const { manifesto } = conteudo.aSemog
  return (
    <section
      id="a-semog"
      className="cena grao"
      data-tema="marinho"
      aria-labelledby="a-semog-titulo"
    >
      <div className="container mf-quadro">
        <h1 id="a-semog-titulo" className="mf-titulo entrada">
          {manifesto.antes} <em className="peso">{manifesto.enfase}</em> {manifesto.depois}
        </h1>

        <dl className="mf-numeros">
          {numerosDoManifesto().map((numero) => (
            <div key={numero.chave} className="mf-numero entrada">
              <dt className="rotulo">
                <span className="mf-mascara">
                  <span className="mf-in">{numero.rotulo}</span>
                </span>
              </dt>
              <dd className="num">
                <span className="mf-mascara">
                  <span
                    className="mf-in"
                    data-conta={numero.valor}
                    data-prefixo={numero.prefixo}
                    data-sufixo={numero.sufixo}
                  >
                    {numero.prefixo}
                    {numero.valor}
                    {numero.sufixo}
                  </span>
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
