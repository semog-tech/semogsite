import './aplicativo.css'
import { conteudo } from '@/site/conteudo/conteudo'

/**
 * Soluções · o aplicativo do morador: título e texto numa linha, as seis funções em três colunas,
 * sem caixa. No pé, o clube de benefícios em nota compacta (está sendo atualizado), com a âncora
 * #beneficios de hoje.
 */
export function AplicativoEBeneficios() {
  const { aplicativo, clube } = conteudo.solucoesPagina
  return (
    <section
      id="aplicativo"
      className="cena sl-aplicativo"
      data-tema="claro"
      aria-labelledby="aplicativo-titulo"
    >
      <div className="container sl-ap-topo">
        <h2 id="aplicativo-titulo" className="sl-ap-titulo">
          {aplicativo.titulo}
        </h2>
        <p className="sl-ap-texto">{aplicativo.texto}</p>
      </div>
      <ul className="container sl-ap-funcoes">
        {aplicativo.itens.map((item) => (
          <li key={item.titulo} className="sl-ap-funcao">
            <h3>{item.titulo}</h3>
            <p>{item.texto}</p>
          </li>
        ))}
      </ul>
      <div className="container">
        <aside id="beneficios" className="sl-clube" aria-labelledby="beneficios-titulo">
          <h2 id="beneficios-titulo" className="sl-clube-titulo">
            {clube.titulo}
          </h2>
          <p>{clube.texto}</p>
        </aside>
      </div>
    </section>
  )
}
