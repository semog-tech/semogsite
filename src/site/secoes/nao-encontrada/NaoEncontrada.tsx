import './nao-encontrada.css'
import type React from 'react'
import { conteudo } from '@/site/conteudo/conteudo'
import { comIndice } from '@/site/estilo'
import { caminhoNoSite } from '@/site/rotas'

type ChaveDoCartao = keyof typeof conteudo.naoEncontrada.links

/**
 * Os outros quatro caminhos, na ordem da 404 do protótipo. Sem "Sou cliente" no corpo (DP6): o
 * cabeçalho e o rodapé já o têm, e o Contato leva à 2ª via. O pedido de proposta é o caminho
 * principal e fica à parte, ao lado do título.
 */
const CARTOES: ReadonlyArray<readonly [ChaveDoCartao, string]> = [
  ['inicio', '/'],
  ['unidades', '/#unidades'],
  ['blog', '/blog'],
  ['contato', '/contato'],
]

function CorpoDoCartao({ chave }: { chave: ChaveDoCartao }): React.ReactNode {
  const { titulo, texto } = conteudo.naoEncontrada.links[chave]
  return (
    <>
      <strong>{titulo}</strong>
      <span>{texto}</span>
      <svg className="seta" aria-hidden="true">
        <use href="#seta" />
      </svg>
    </>
  )
}

/**
 * 404 do site v2 (resposta do Leandro, 16/10/2026): o título não afirma que a página existiu; ao
 * lado, o pedido de proposta em destaque, no marinho; o traço da marca se perde no meio e volta
 * mais abaixo; e os outros caminhos vêm numa fileira de cartões, tudo na primeira tela.
 */
export function NaoEncontrada() {
  const t = conteudo.naoEncontrada
  return (
    <section id="nao-encontrada" className="ne" data-tema="claro" aria-labelledby="ne-titulo">
      <div className="container ne-topo">
        <div className="ne-cabeca">
          <p className="ne-rotulo rotulo">{t.rotulo}</p>
          <h1 id="ne-titulo" className="ne-titulo">
            <span className="linha">
              <span className="linha-interna" style={comIndice(0)}>
                {t.titulo}
              </span>
            </span>{' '}
            <span className="linha">
              <span className="linha-interna" style={comIndice(1)}>
                <em className="peso peso-fixo" data-texto={t.enfase}>
                  {t.enfase}
                </em>
              </span>
            </span>
          </h1>
          <p className="ne-texto">{t.texto}</p>
        </div>
        <a className="ne-cartao ne-principal" href={caminhoNoSite('/proposta')}>
          <CorpoDoCartao chave="proposta" />
        </a>
      </div>
      <svg
        className="ne-traco"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path className="percurso ne-ida" pathLength={1} d="M0 40H560" />
        <path className="percurso ne-volta" pathLength={1} d="M700 96C820 96 860 40 980 40H1440" />
      </svg>
      <div className="container ne-caminhos">
        <ul className="ne-links">
          {CARTOES.map(([chave, href], i) => (
            <li key={chave} style={comIndice(i)}>
              <a className="ne-cartao" href={caminhoNoSite(href)}>
                <CorpoDoCartao chave={chave} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
