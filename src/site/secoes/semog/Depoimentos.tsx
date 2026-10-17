import './depoimentos.css'
import { conteudo } from '@/site/conteudo/conteudo'

type Depoimento = (typeof conteudo.depoimentos.itens)[number]

function Citacao({ depoimento, maior = false }: { depoimento: Depoimento; maior?: boolean }) {
  return (
    <figure className={maior ? 'dp-citacao dp-citacao--maior' : 'dp-citacao'}>
      <blockquote className="dp-texto">{depoimento.texto}</blockquote>
      <figcaption className="dp-autoria">
        <span className="dp-nome">
          {depoimento.nome} · {depoimento.cidade}
        </span>
        <span className="rotulo">
          {conteudo.aSemog.depoimentos.origem} · {depoimento.data}
        </span>
      </figcaption>
    </figure>
  )
}

/**
 * Depoimentos (A Semog): três síndicas falam da relação com a Semog, em avaliações públicas no
 * Google, com o texto como publicado. A mais curta é a maior; as outras duas seguem em 61,8/38,2.
 */
export function Depoimentos() {
  const { titulo, itens } = conteudo.depoimentos
  return (
    <section
      id="depoimentos"
      className="cena"
      data-tema="claro"
      aria-labelledby="depoimentos-titulo"
    >
      <div className="container dp-quadro">
        <h2 id="depoimentos-titulo" className="dp-titulo">
          {titulo}
        </h2>
        <Citacao depoimento={itens[1]} maior />
        <div className="dp-par">
          <Citacao depoimento={itens[0]} />
          <Citacao depoimento={itens[2]} />
        </div>
      </div>
    </section>
  )
}
