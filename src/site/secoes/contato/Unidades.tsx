import './unidades.css'
import { conteudo } from '@/site/conteudo/conteudo'

/**
 * Unidades do Contato, no gelo: as quatro Unidades Semog com foto da cidade, endereço, telefone,
 * horário e "Como chegar". O telefone vai como texto, sem link de discagem (decisão do Leandro).
 */
export function UnidadesDoContato() {
  const { contatoPagina, unidades, cidades, landing } = conteudo
  return (
    <section id="contato-unidades" className="cena cn" data-tema="gelo" aria-labelledby="cn-titulo">
      <div className="container">
        <h2 id="cn-titulo" className="cn-titulo revelar">
          <span className="linha">
            <span className="linha-interna">
              {contatoPagina.unidades.titulo}{' '}
              <em className="peso peso-fixo" data-texto={contatoPagina.unidades.enfase}>
                {contatoPagina.unidades.enfase}
              </em>
            </span>
          </span>
        </h2>
        <div className="cn-grade">
          {unidades.map((unidade) => {
            const cidade = cidades[unidade.id]
            return (
              <article
                key={unidade.id}
                className="cn-unidade revelar revelar--bloco"
                aria-labelledby={`cn-${unidade.id}`}
              >
                <figure className="cn-foto">
                  {/* biome-ignore lint/performance/noImgElement: a cena anima moldura e parallax no próprio <img>, e /site-v2 fica fora do localPatterns do next/image */}
                  <img
                    src={cidade.fotoMovel}
                    alt={cidade.alt}
                    width={800}
                    height={447}
                    loading="lazy"
                    decoding="async"
                  />
                </figure>
                <div className="cn-corpo">
                  <h3 id={`cn-${unidade.id}`} className="cn-cidade">
                    {unidade.cidade}
                    <span className="cn-uf">/{unidade.uf}</span>
                  </h3>
                  <dl className="cn-dados">
                    <div>
                      <dt className="rotulo">{landing.unidade.endereco}</dt>
                      <dd>{cidade.endereco}</dd>
                    </div>
                    <div>
                      <dt className="rotulo">{landing.unidade.telefone}</dt>
                      <dd className="cn-telefone">{cidade.telefone}</dd>
                    </div>
                    <div>
                      <dt className="rotulo">{landing.unidade.horario}</dt>
                      <dd>{landing.unidade.horarioTexto}</dd>
                    </div>
                  </dl>
                  <a className="link-seta" href={cidade.mapa} target="_blank" rel="noopener">
                    <span>{landing.unidade.mapa}</span>
                    <span className="sr-only"> até a Unidade {unidade.cidade}</span>
                    <svg className="seta" aria-hidden="true">
                      <use href="#seta" />
                    </svg>
                  </a>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
