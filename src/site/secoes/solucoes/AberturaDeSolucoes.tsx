import './abertura.css'
import { conteudo } from '@/site/conteudo/conteudo'
import { caminhoNoSite } from '@/site/rotas'

/** As fotos das Unidades têm versão de 800px ao lado da cheia (as mesmas das landings de cidade). */
function fotoMenor(foto: string): string {
  return foto.replace(/\.webp$/, '-800.webp')
}

/**
 * Soluções · abertura: o que a Semog cobre, numa frase, e o pedido de proposta (61,8); ao lado
 * (38,2), as quatro Unidades Semog em faixas, cada uma levando à página da cidade. A "equipe só"
 * da frase está nas quatro cidades.
 */
export function AberturaDeSolucoes() {
  const { abertura } = conteudo.solucoesPagina
  return (
    <section
      id="solucoes"
      className="cena sl-abertura"
      data-tema="claro"
      aria-labelledby="sl-titulo"
    >
      <div className="container sl-ab-quadro">
        <div className="sl-ab-texto">
          <h1 id="sl-titulo" className="sl-titulo entrada">
            {abertura.antes} <em className="peso">{abertura.enfase}</em>
          </h1>
          <p className="lead sl-lead entrada">{abertura.lead}</p>
          <div className="sl-acoes entrada">
            <a className="botao" href="#proposta">
              {abertura.botao}
              <svg className="seta" aria-hidden="true">
                <use href="#seta" />
              </svg>
            </a>
          </div>
        </div>

        <ul className="sl-cidades entrada" aria-label="Unidades Semog">
          {conteudo.unidades.map((unidade) => (
            <li key={unidade.id} className="sl-cidade">
              <a href={caminhoNoSite(unidade.url)}>
                <span className="moldura">
                  {/* biome-ignore lint/performance/noImgElement: a cena anima a cortina e o parallax no próprio <img>, e /site-v2 fica fora do localPatterns do next/image */}
                  <img
                    src={unidade.foto}
                    srcSet={`${fotoMenor(unidade.foto)} 800w, ${unidade.foto} 1376w`}
                    sizes="(max-width: 760px) 50vw, 460px"
                    alt={unidade.alt}
                    width={1376}
                    height={768}
                    decoding="async"
                  />
                </span>
                <span className="sl-cidade-nome">
                  {unidade.cidade}
                  <svg className="seta" aria-hidden="true">
                    <use href="#seta" />
                  </svg>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
