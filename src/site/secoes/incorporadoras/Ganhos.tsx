import './ganhos.css'
import { conteudo } from '@/site/conteudo/conteudo'

type Zona = (typeof conteudo.incorporadoras.ganhos.zonas)[number]

/** As três zonas, na ordem do protótipo: o id do nome e o tema de cada uma. */
const ZONAS = [
  { chave: 'entrega', tema: 'marinho' },
  { chave: 'cliente', tema: 'gelo' },
  { chave: 'marca', tema: 'claro' },
] as const

/**
 * Ganhos: a promessa da abertura ("protegendo a entrega, o cliente e a sua marca") vira as três
 * zonas da cena, numa superfície que desce do marinho do percurso ao branco. Na marca, as quatro
 * praças em fotos reais. Um fio de ponta reta desce pela margem e liga as três.
 */
export function Ganhos() {
  const { ganhos } = conteudo.incorporadoras
  return (
    <section id="ganhos" className="cena" data-tema="marinho" aria-labelledby="ganhos-titulo">
      <div className="gn-fio" aria-hidden="true">
        <span className="gn-fio-traco" />
      </div>

      <div className="container gn-topo" data-tema="marinho">
        <h2 id="ganhos-titulo" className="gn-titulo">
          {ganhos.titulo}
        </h2>
      </div>

      {ZONAS.map(({ chave, tema }, i) => {
        const zona = ganhos.zonas[i]
        if (!zona) throw new Error(`[ganhos] falta a zona ${chave} no conteúdo.`)
        return (
          <article
            key={chave}
            className={`gn-zona gn-zona--${chave}`}
            data-tema={tema}
            aria-labelledby={`gn-${chave}`}
          >
            <ConteudoDaZona id={`gn-${chave}`} zona={zona} />
            {chave === 'marca' ? <Pracas /> : null}
          </article>
        )
      })}
    </section>
  )
}

function ConteudoDaZona({ id, zona }: { id: string; zona: Zona }) {
  return (
    <div className="container gn-conteudo">
      <span className="gn-no" aria-hidden="true" />
      <h3 id={id} className="gn-nome">
        {zona.titulo}
      </h3>
      <div className="gn-textos">
        <p className="gn-texto">{zona.texto}</p>
        <p className="gn-apoio">{zona.apoio}</p>
      </div>
    </div>
  )
}

/** As quatro praças, com a foto de cada Unidade Semog. */
function Pracas() {
  return (
    <div className="container gn-pracas">
      <ul className="gn-cidades">
        {conteudo.unidades.map((unidade) => (
          <li key={unidade.id}>
            <figure className="gn-cidade">
              <div className="moldura">
                {/* biome-ignore lint/performance/noImgElement: a cena anima moldura e parallax no próprio <img>, e /site-v2 fica fora do localPatterns do next/image */}
                <img
                  src={unidade.foto}
                  alt={unidade.alt}
                  width={1376}
                  height={768}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption className="rotulo">
                {unidade.cidade}/{unidade.uf}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </div>
  )
}
