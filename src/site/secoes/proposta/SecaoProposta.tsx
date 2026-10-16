import './proposta.css'
import { conteudo } from '@/site/conteudo/conteudo'
import { FormularioProposta } from '@/site/formularios/proposta/FormularioProposta'

/** Seção do pedido de proposta. O título fica no HTML; o formulário é client. Fase 2: só na prévia. */
export function SecaoProposta({ ufInicial }: { ufInicial?: string }) {
  return (
    <section id="proposta" data-tema="claro" aria-labelledby="proposta-titulo">
      <div className="container proposta-grade">
        <h2 id="proposta-titulo" className="proposta-titulo">
          {conteudo.proposta.titulo}
        </h2>
        <FormularioProposta id="proposta-form" ufInicial={ufInicial} />
      </div>
    </section>
  )
}
