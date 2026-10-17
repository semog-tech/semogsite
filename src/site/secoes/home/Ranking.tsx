import './ranking.css'
import { conteudo } from '@/site/conteudo/conteudo'
import { formatarNumero } from '@/site/formatar'

/** Seção do ranking (home). Sem JS: chamada, manchete, três passos, ciclos e foto, em leitura corrida. */
export function Ranking() {
  const { ranking } = conteudo
  const total = formatarNumero(ranking.total)
  const [atual] = ranking.ciclos
  // Do ciclo mais antigo ao atual (a linha se desenha da esquerda para a direita); o atual é destacado.
  const ciclosEmOrdem = [...ranking.ciclos].reverse()
  return (
    <section id="ranking" className="cena" data-tema="claro" aria-labelledby="ranking-titulo">
      <div className="ranking-palco">
        {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: o canvas não tem tabindex nem interação (o Biome o trata como focável); é decorativo e o texto ao lado é a versão completa */}
        <canvas className="ranking-campo" aria-hidden="true" />
        <div className="container ranking-grade">
          {/* TEXTO-NOVO: fato informado pelo Leandro (a mais bem posicionada do Norte e Nordeste); ainda não está no conteúdo tipado */}
          <h2 id="ranking-titulo" className="ranking-passo ranking-chamada">
            <span data-texto="">
              A administradora <span className="peso">mais bem posicionada</span> do Norte e
              Nordeste.
            </span>
          </h2>
          <p className="ranking-manchete">
            <span className="ranking-posicao-mascara">
              <span className="ranking-posicao num peso">{ranking.posicao}º</span>
            </span>{' '}
            {/* TEXTO-NOVO: a manchete aprovada, dividida em numeral + frase (mesmo texto de ranking.titulo) */}
            <span className="ranking-entre">entre mais de {total} administradoras</span>
          </p>
          <div className="ranking-passos">
            <div className="ranking-passo" data-passo="0">
              {/* TEXTO-NOVO */}
              <p className="ranking-frase" data-texto="">
                Mais de <span className="peso">{total} administradoras</span> usam a Superlógica.
              </p>
            </div>
            <div className="ranking-passo" data-passo="1">
              {/* TEXTO-NOVO */}
              <p className="ranking-frase" data-texto="">
                Todo mês, o Ranking <span className="peso">Top 200</span> classifica essa base.
              </p>
              <p className="ranking-apoio" data-texto="">
                {ranking.apoio}
              </p>
            </div>
            <div className="ranking-passo" data-passo="2">
              {/* TEXTO-NOVO: mesmo fato de ranking.g20, com ênfase */}
              <p className="ranking-frase" data-texto="">
                No <span className="peso">G20 Condo</span> pelo terceiro ciclo seguido.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container ranking-depois">
        <div className="ranking-historico">
          {/* TEXTO-NOVO */}
          <p className="ranking-historico-titulo">Três ciclos seguidos no G20 Condo</p>
          <div className="ranking-linha">
            <span className="ranking-traco" aria-hidden="true" />
            <ol className="ranking-ciclos">
              {ciclosEmOrdem.map((ciclo) => (
                <li
                  key={ciclo.ciclo}
                  className={ciclo === atual ? 'ranking-ciclo-atual' : undefined}
                >
                  <span className="ranking-ciclo">
                    <span>Ciclo {ciclo.ciclo}</span>
                  </span>
                  <span className="ranking-ciclo-posicao">
                    {ciclo === atual ? (
                      <span>
                        G20 Condo, <span className="num">{ciclo.posicao}º</span>
                      </span>
                    ) : (
                      <span>G20 Condo</span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <figure className="ranking-foto">
          <div className="moldura">
            {/* biome-ignore lint/performance/noImgElement: a cena anima moldura e parallax no próprio <img> (revelarQuadro), e /site-v2 fica fora do localPatterns do next/image */}
            <img
              src={ranking.foto}
              alt={ranking.alt}
              width={1600}
              height={900}
              loading="lazy"
              decoding="async"
            />
          </div>
          {/* TEXTO-NOVO: legenda derivada do alt (ranking.alt) */}
          <figcaption>Superlógica Next 2026, placa do G20 Condo.</figcaption>
        </figure>
      </div>
    </section>
  )
}
