import './leia-tambem.css'
import type { CartaoDePost } from '@/site/leitura/dados'
import { CartaoDoPost } from './CartaoDoPost'

/** "Leia também": dois cartões no gelo, antes do pedido de proposta (protótipo, 03-leia-tambem). */
export function LeiaTambem({
  cartoes,
  todos,
}: {
  cartoes: readonly CartaoDePost[]
  todos: string
}) {
  if (cartoes.length === 0) return null
  return (
    <section
      id="leia-tambem"
      className="cena"
      data-tema="gelo"
      aria-labelledby="leia-tambem-titulo"
    >
      <div className="container">
        <div className="lt-topo">
          {/* TEXTO-NOVO: "Leia também", "Todos os textos" (protótipo) */}
          <h2 id="leia-tambem-titulo" className="lt-titulo">
            Leia também
          </h2>
          <a className="link-seta" href={todos}>
            <span>Todos os textos</span>
            <svg className="seta" aria-hidden="true">
              <use href="#seta" />
            </svg>
          </a>
        </div>
        <ul className="lt-lista">
          {cartoes.map((cartao) => (
            <li key={cartao.slug}>
              <CartaoDoPost cartao={cartao} nivel="h3" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
