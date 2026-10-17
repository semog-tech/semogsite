import './bloco.css'

export type DadosDoBloco = {
  id: string
  titulo: string
  texto: string
  itens: ReadonlyArray<{ titulo: string; texto: string; estado?: string }>
  link?: { href: string; rotulo: string }
}

/**
 * Soluções · um bloco sobre o gelo (prestação de contas, software): título e texto à esquerda
 * (38,2), os itens em blocos brancos à direita (61,8).
 */
export function BlocoDeSolucao({ bloco }: { bloco: DadosDoBloco }) {
  const tituloId = `${bloco.id}-titulo`
  return (
    <section id={bloco.id} className="cena sl-bloco" data-tema="gelo" aria-labelledby={tituloId}>
      <div className="container sl-bloco-grade">
        <div>
          <h2 id={tituloId} className="sl-bloco-titulo">
            {bloco.titulo}
          </h2>
          <p className="sl-bloco-texto">{bloco.texto}</p>
          {bloco.link ? (
            <a className="link-seta" href={bloco.link.href}>
              <span>{bloco.link.rotulo}</span>
              <svg className="seta" aria-hidden="true">
                <use href="#seta" />
              </svg>
            </a>
          ) : null}
        </div>
        <ul className="sl-lista">
          {bloco.itens.map((item) => (
            <li key={item.titulo}>
              {item.estado ? <span className="rotulo sl-estado">{item.estado}</span> : null}
              <h3>{item.titulo}</h3>
              <p>{item.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
