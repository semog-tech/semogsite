import './artigo.css'
import type { ReactElement, ReactNode } from 'react'
import { ImageMedia } from '@/components/Media/ImageMedia'
import { type ItemDoIndice, MINIMO_PARA_INDICE } from '@/site/leitura/dados'
import type { Media } from '@/types/media'

export type TopoDoArtigo =
  | { tipo: 'post'; categoria: string; dataTexto: string; minutos: number; voltar: string }
  | { tipo: 'documento'; atualizacao: string }

export type DadosDoArtigo = {
  titulo: string
  resumo?: string
  topo: TopoDoArtigo
  imagem?: Media
  indice: readonly ItemDoIndice[]
  emResumo: readonly string[]
  /** O MDX já compilado (corpoDoMdx). */
  corpo: ReactElement
  /** Depois do texto: o controle de cookies da Privacidade. */
  depoisDoCorpo?: ReactNode
}

function Topo({ topo }: { topo: TopoDoArtigo }) {
  if (topo.tipo === 'documento') return <p className="post-meta artigo-meta">{topo.atualizacao}</p>
  return (
    <>
      {/* TEXTO-NOVO: "Blog" (voltar), "min de leitura" (protótipo) */}
      <a className="artigo-voltar" href={topo.voltar}>
        <svg className="seta" aria-hidden="true">
          <use href="#seta" />
        </svg>
        <span>Blog</span>
      </a>
      <p className="post-meta artigo-meta">
        <span className="post-categoria">{topo.categoria}</span>
        <span>{topo.dataTexto}</span>
        <span>{topo.minutos} min de leitura</span>
      </p>
    </>
  )
}

/**
 * Modelo de artigo, o mesmo para posts, Privacidade e Termos (protótipo, 02-artigo): coluna de
 * 60 a 70 caracteres por linha, índice lateral fixo no desktop (no celular, no topo do texto) e
 * barra de progresso de 2 px sob o cabeçalho. O único movimento é a entrada do título, em CSS.
 */
export function Artigo({ dados }: { dados: DadosDoArtigo }) {
  const { titulo, resumo, topo, imagem, indice, emResumo, corpo, depoisDoCorpo } = dados
  return (
    <section id="artigo" className="cena artigo" data-tema="claro" aria-labelledby="artigo-titulo">
      <div className="artigo-progresso" aria-hidden="true">
        <span data-progresso="" />
      </div>
      <div className="container artigo-grade">
        <header className="artigo-topo">
          <Topo topo={topo} />
          <h1 id="artigo-titulo" className="artigo-titulo">
            {titulo}
          </h1>
          {resumo ? <p className="artigo-lead">{resumo}</p> : null}
        </header>

        {imagem ? (
          <figure className="artigo-capa">
            <ImageMedia
              resource={imagem}
              priority
              fetchPriority="high"
              sizes="(min-width: 1310px) 1200px, 100vw"
            />
          </figure>
        ) : null}

        {indice.length >= MINIMO_PARA_INDICE ? (
          <nav className="artigo-indice" data-indice="" aria-labelledby="artigo-indice-titulo">
            {/* TEXTO-NOVO: "Neste texto" (protótipo) */}
            <p id="artigo-indice-titulo" className="artigo-indice-titulo">
              Neste texto
            </p>
            <ol>
              {indice.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`}>{item.texto}</a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div className="artigo-coluna">
          {emResumo.length > 0 ? (
            <aside className="artigo-resumo" aria-labelledby="artigo-resumo-titulo">
              <p id="artigo-resumo-titulo" className="artigo-resumo-titulo">
                Em resumo
              </p>
              <ul>
                {emResumo.map((ponto) => (
                  <li key={ponto}>{ponto}</li>
                ))}
              </ul>
            </aside>
          ) : null}
          <div className="artigo-corpo" data-corpo-leitura="">
            {corpo}
          </div>
          {depoisDoCorpo}
        </div>
      </div>
    </section>
  )
}
