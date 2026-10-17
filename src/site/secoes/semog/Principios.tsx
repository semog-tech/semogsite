import './principios.css'
import type { ReactNode } from 'react'
import { conteudo } from '@/site/conteudo/conteudo'

type Principio = (typeof conteudo.aSemog.principios)[number]

/** O tema de cada zona: o gradiente do rebrand em que o princípio mora. */
const TEMA_DA_ZONA: Record<Principio['id'], 'marinho' | 'gelo' | 'claro'> = {
  retidao: 'marinho',
  transparencia: 'gelo',
  dinamica: 'claro',
}

function Zona({ principio, fundo }: { principio: Principio; fundo?: ReactNode }) {
  return (
    <article
      className={`pr-zona pr-zona--${principio.id}`}
      data-tema={TEMA_DA_ZONA[principio.id]}
      aria-labelledby={`pr-${principio.id}`}
    >
      {fundo}
      <div className="container pr-conteudo">
        <span className="pr-no" aria-hidden="true" />
        <h3 id={`pr-${principio.id}`} className="pr-nome">
          {principio.titulo}
        </h3>
        <p className="pr-texto">{principio.texto}</p>
      </div>
    </article>
  )
}

/**
 * Princípios (A Semog): os três nomes são os três gradientes do rebrand, e cada princípio mora no
 * seu, numa superfície contínua; um fio de ponta reta desce pela margem e liga os três.
 */
export function Principios() {
  const [retidao, transparencia, dinamica] = conteudo.aSemog.principios
  return (
    <section
      id="principios"
      className="cena"
      data-tema="marinho"
      aria-labelledby="principios-titulo"
    >
      {/* TEXTO-NOVO */}
      <h2 id="principios-titulo" className="sr-only">
        Princípios da Semog
      </h2>
      <div className="pr-fio" aria-hidden="true">
        <span className="pr-fio-traco" />
      </div>
      <Zona principio={retidao} />
      <Zona principio={transparencia} />
      <Zona
        principio={dinamica}
        fundo={
          // biome-ignore lint/a11y/noAriaHiddenOnFocusable: o canvas não tem tabindex nem interação (o Biome o trata como focável); é o mesh decorativo, e o fundo CSS fica por baixo
          <canvas className="pr-mesh" aria-hidden="true" />
        }
      />
    </section>
  )
}
