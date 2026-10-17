import './instalacao.css'
import { conteudo } from '@/site/conteudo/conteudo'

/**
 * Instalação: o que a implantação deixa pronto no dia da assembleia de instalação, na ordem do
 * fluxo do sistema próprio da Semog, sem promessa além dele. Um fio de ponta reta desce pela lista
 * e acende cada item; o último traz o contexto da prestação de contas digital.
 */
export function Instalacao() {
  const { instalacao } = conteudo.incorporadoras
  const ultimo = instalacao.itens.length - 1
  return (
    <section id="instalacao" className="cena" data-tema="claro" aria-labelledby="instalacao-titulo">
      <div className="container it-quadro">
        <div className="it-topo">
          <h2 id="instalacao-titulo" className="it-titulo">
            {instalacao.tituloA} <em className="peso">{instalacao.tituloB}</em>
          </h2>
          <p className="it-lead lead">{instalacao.lead}</p>
        </div>
        <div className="it-lista">
          <div className="it-fio" aria-hidden="true">
            <span className="it-fio-traco" />
          </div>
          <ol className="it-itens">
            {instalacao.itens.map((item, i) => (
              <li key={item.titulo} className="it-item">
                <span className="it-no" aria-hidden="true" />
                <h3 className="it-nome">{item.titulo}</h3>
                <div className="it-textos">
                  <p className="it-texto">{item.texto}</p>
                  {i === ultimo ? (
                    <p className="it-contexto rotulo">{conteudo.tecnologia.contexto}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
