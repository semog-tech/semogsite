import './bloco.css'

export type DadosDoBloco = {
  id: string
  tema: 'claro' | 'gelo'
  titulo: string
  texto: string
  itens: ReadonlyArray<{ titulo: string; texto: string; estado?: string }>
  destaque?: string
  link?: { href: string; rotulo: string }
}

/**
 * Soluções · um bloco (prestação, Garante, aplicativo, software, clube): título e texto à
 * esquerda (38,2), os itens em blocos à direita (61,8). Sem itens, o texto ocupa a linha.
 */
export function BlocoDeSolucao({ bloco }: { bloco: DadosDoBloco }) {
  const tituloId = `${bloco.id}-titulo`
  return (
    <section
      id={bloco.id}
      className="cena sl-bloco"
      data-tema={bloco.tema}
      aria-labelledby={tituloId}
    >
      <div className="container sl-bloco-grade">
        <div>
          <h2 id={tituloId} className="sl-bloco-titulo">
            {bloco.titulo}
          </h2>
          <p className="sl-bloco-texto">{bloco.texto}</p>
          {bloco.destaque ? <p className="sl-bloco-destaque">{bloco.destaque}</p> : null}
          {bloco.link ? (
            <a className="link-seta" href={bloco.link.href}>
              <span>{bloco.link.rotulo}</span>
              <svg className="seta" aria-hidden="true">
                <use href="#seta" />
              </svg>
            </a>
          ) : null}
        </div>
        {bloco.itens.length > 0 ? (
          <ul className="sl-lista">
            {bloco.itens.map((item) => (
              <li key={item.titulo}>
                {item.estado ? <span className="rotulo sl-estado">{item.estado}</span> : null}
                <h3>{item.titulo}</h3>
                <p>{item.texto}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
