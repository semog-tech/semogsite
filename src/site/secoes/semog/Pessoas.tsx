import './pessoas.css'
import { conteudo, type FotoDosSocios } from '@/site/conteudo/conteudo'
import { estaPendente, type OuPendente } from '@/site/conteudo/pendencias'
import { Pendencia } from '@/site/secoes/comum/Pendencia'

type Item = (typeof conteudo.aSemog.pessoas.itens)[number]

function ItemDePessoas({ item, largo = false }: { item: Item; largo?: boolean }) {
  return (
    <div className={largo ? 'ps-item ps-item--largo' : 'ps-item'}>
      <h3 className="ps-item-titulo">{item.titulo}</h3>
      <p className="ps-item-texto">{item.texto}</p>
    </div>
  )
}

/**
 * A moldura dos sócios: a foto, quando o arquivo chega; até lá, o selo da pendência na prévia. O
 * tipo declarado vale nos dois casos (com a pendência, o conteúdo estreita para ela).
 */
function MolduraDosSocios({ foto }: { foto: OuPendente<FotoDosSocios> }) {
  if (estaPendente(foto)) {
    return (
      <div className="moldura ps-aenviar">
        <p className="ps-aenviar-rotulo">
          <Pendencia item={foto} />
        </p>
      </div>
    )
  }
  return (
    <div className="moldura">
      {/* biome-ignore lint/performance/noImgElement: a cena anima a moldura, e /site-v2 fica fora do localPatterns do next/image */}
      <img
        src={foto.src}
        alt={foto.alt}
        width={foto.largura}
        height={foto.altura}
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}

/**
 * Pessoas (A Semog): "Tecnologia na operação. Gente na relação." em zigue-zague áureo: a moldura
 * dos sócios com o acesso fácil a eles, as equipes locais com as quatro cidades e os
 * relacionamentos de década em toda a largura.
 */
export function Pessoas() {
  const { pessoas } = conteudo.aSemog
  const [socios, equipes, decada] = pessoas.itens
  return (
    <section id="pessoas" className="cena" data-tema="claro" aria-labelledby="pessoas-titulo">
      <div className="container ps-quadro">
        <div className="ps-topo">
          <h2 id="pessoas-titulo" className="ps-titulo">
            {pessoas.tituloA} <em className="peso">{pessoas.tituloB}</em>
          </h2>
          <p className="ps-lead lead">{pessoas.texto}</p>
        </div>

        <div className="ps-par">
          <figure className="ps-socios">
            <MolduraDosSocios foto={pessoas.fotoDosSocios} />
            <figcaption className="rotulo">{pessoas.legenda}</figcaption>
          </figure>
          <ItemDePessoas item={socios} />
        </div>

        <div className="ps-par ps-par--inverso">
          <ItemDePessoas item={equipes} />
          <ul className="ps-cidades">
            {conteudo.unidades.map((unidade) => (
              <li key={unidade.id}>
                <figure className="ps-cidade">
                  <div className="moldura">
                    {/* biome-ignore lint/performance/noImgElement: a cena anima moldura e zoom no próprio <img>, e /site-v2 fica fora do localPatterns do next/image */}
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

        <ItemDePessoas item={decada} largo />
      </div>
    </section>
  )
}
