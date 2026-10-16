import './abertura.css'
import { conteudo } from '@/site/conteudo/conteudo'
import { FormularioProposta } from '@/site/formularios/proposta/FormularioProposta'

/**
 * Abertura "Metades" (home): as quatro Unidades Semog em sequência, à esquerda, e o slogan com o
 * pedido de proposta (etapa 1), à direita. Sem JS, fica a primeira foto e o formulário inteiro.
 */
export function Abertura() {
  const { unidades, marca } = conteudo
  const [primeira] = unidades
  return (
    <section id="abertura" className="abertura" data-tema="claro" aria-labelledby="abertura-titulo">
      <div className="abertura-palco">
        <figure className="vitrine" aria-label="Unidades Semog">
          <div className="vitrine-moldura">
            {unidades.map((unidade, i) => (
              <div
                key={unidade.id}
                className="slide"
                data-cidade={`${unidade.cidade} · Unidade Semog`}
              >
                {/* biome-ignore lint/performance/noImgElement: a cena anima cortina, Ken Burns e parallax no próprio <img>, e /site-v2 fica fora do localPatterns do next/image */}
                <img
                  src={unidade.foto}
                  alt={unidade.alt}
                  width={1376}
                  height={768}
                  fetchPriority={i === 0 ? 'high' : undefined}
                />
              </div>
            ))}
          </div>
          <figcaption className="vitrine-legenda entrada">
            <span className="vitrine-cidade" aria-live="polite">
              <span data-cidade-atual="">{primeira.cidade} · Unidade Semog</span>
            </span>
            <span className="vitrine-passos" aria-hidden="true">
              {unidades.map((unidade) => (
                <i key={unidade.id} />
              ))}
            </span>
          </figcaption>
        </figure>

        <div className="abertura-texto">
          <h1 id="abertura-titulo" className="abertura-titulo">
            <span className="linha">
              <span className="linha-interna entrada abertura-inteira">Preocupe-se</span>
            </span>{' '}
            <span className="linha">
              <span className="linha-interna entrada">apenas em</span>
            </span>{' '}
            <span className="linha">
              <span className="linha-interna entrada">
                <em className="peso">morar.</em>
              </span>
            </span>
          </h1>
          <p className="abertura-sub entrada">{marca.subtitulo}</p>

          <FormularioProposta id="abertura-form" classe="abertura-form" comEntrada />
        </div>
      </div>
    </section>
  )
}
