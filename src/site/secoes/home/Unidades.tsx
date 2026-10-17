import './unidades.css'
import { conteudo } from '@/site/conteudo/conteudo'
import { caminhoNoSite } from '@/site/rotas'

type Depoimento = (typeof conteudo.depoimentos.itens)[number]
type Unidade = (typeof conteudo.unidades)[number]
type Voz = { indice: number; tamanho: 'curta' | 'longa' }

/**
 * A voz de quem é atendido por cada Unidade (índice em `depoimentos.itens`), como no protótipo:
 * Campina Grande fica sem depoimento, e Belém tem duas vozes, a segunda abaixo da foto.
 */
const VOZES: Record<string, { voz?: Voz; extra?: number }> = {
  recife: { voz: { indice: 3, tamanho: 'curta' } },
  'joao-pessoa': { voz: { indice: 0, tamanho: 'longa' } },
  'campina-grande': {},
  belem: { voz: { indice: 1, tamanho: 'curta' }, extra: 2 },
}

function depoimento(indice: number): Depoimento {
  const item = conteudo.depoimentos.itens[indice]
  if (!item) throw new Error(`[unidades] depoimentos.itens sem o item ${indice}.`)
  return item
}

function VozDoCliente({ item, classe }: { item: Depoimento; classe: string }) {
  return (
    <figure className={classe}>
      <svg className="voz-aspas" viewBox="0 0 34 21" aria-hidden="true">
        <path d="M7 0h8L8 21H0z M24 0h8l-7 21h-8z" />
      </svg>
      <blockquote className="voz-texto">
        <p>{item.texto}</p>
      </blockquote>
      <figcaption className="voz-autor">
        <span className="voz-nome">{item.nome}</span>
        <span className="voz-fonte">Avaliação no Google · {item.data}</span>
      </figcaption>
    </figure>
  )
}

function CartaoDaUnidade({ unidade, indice }: { unidade: Unidade; indice: number }) {
  const { voz, extra } = VOZES[unidade.id] ?? {}
  const lado = indice % 2 === 0 ? 'unidade--foto-esquerda' : 'unidade--foto-direita'
  const classe = extra === undefined ? `unidade ${lado}` : `unidade ${lado} unidade--duas-vozes`
  const titulo = `unidade-${unidade.id}`
  return (
    <article className={classe} aria-labelledby={titulo}>
      <figure className="unidade-quadro">
        <div className="moldura">
          {/* biome-ignore lint/performance/noImgElement: a cena anima moldura e parallax no próprio <img> (revelarQuadro), e /site-v2 fica fora do localPatterns do next/image */}
          <img
            src={unidade.foto}
            alt={unidade.alt}
            width={1376}
            height={768}
            loading="lazy"
            decoding="async"
          />
        </div>
      </figure>
      <div className="unidade-texto">
        <div className="unidade-cabeca">
          <h3 id={titulo} className="unidade-cidade">
            {unidade.cidade}
          </h3>
          {/* TEXTO-NOVO: "Unidade Semog" */}
          <p className="unidade-uf">Unidade Semog · {unidade.uf}</p>
          <a className="link-seta unidade-link" href={caminhoNoSite(unidade.url)}>
            {/* TEXTO-NOVO: "Conheça a Unidade" */}
            <span>
              Conheça a Unidade<span className="sr-only"> {unidade.cidade}</span>
            </span>{' '}
            <svg className="seta" aria-hidden="true">
              <use href="#seta" />
            </svg>
          </a>
        </div>
        {voz ? (
          <VozDoCliente item={depoimento(voz.indice)} classe={`voz voz--${voz.tamanho}`} />
        ) : null}
      </div>
      {extra === undefined ? null : (
        <VozDoCliente item={depoimento(extra)} classe="voz voz--longa voz--extra" />
      )}
    </article>
  )
}

/**
 * Unidades (home), "perto de cada condomínio": as quatro Unidades Semog em grade áurea alternada,
 * ligadas por uma rota contínua, e a voz de quem é atendido por cada uma. O link de cada cidade
 * leva à landing dela.
 */
export function Unidades() {
  const { unidades, unidadesSecao, depoimentos } = conteudo
  return (
    <section id="unidades" className="cena" data-tema="claro" aria-labelledby="unidades-titulo">
      <div className="container">
        <header className="unidades-cabeca">
          <h2 id="unidades-titulo" className="unidades-titulo">
            {unidadesSecao.titulo}
          </h2>
          <p className="unidades-lead lead">{depoimentos.titulo}</p>
        </header>

        <div className="unidades-lista">
          <svg className="unidades-rota" aria-hidden="true" focusable="false">
            <path className="percurso rota-base" />
            <path className="percurso rota-feita" />
            <g className="rota-marcos" />
          </svg>

          {unidades.map((unidade, i) => (
            <CartaoDaUnidade key={unidade.id} unidade={unidade} indice={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
