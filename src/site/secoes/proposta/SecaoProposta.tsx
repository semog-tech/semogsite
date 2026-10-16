import './proposta.css'
import type { Perfil } from '@/lib/propostaDuasEtapas/schema'
import { FormularioProposta } from '@/site/formularios/proposta/FormularioProposta'

type PropsSecaoProposta = { ufInicial?: string; perfilInicial?: Perfil }

/**
 * Pedido de proposta "Metades" (cena 08 do protótipo): o convite no véu lavanda, à esquerda, e o
 * pedido em duas etapas, à direita. Fecha toda página do pacote app e da leitura. O título é o de
 * `conteudo.proposta.titulo` ("Seja Semog."), em duas linhas por máscara, como no protótipo.
 */
export function SecaoProposta({ ufInicial, perfilInicial }: PropsSecaoProposta) {
  return (
    <section
      id="proposta"
      className="cena proposta-metades"
      data-tema="claro"
      aria-labelledby="proposta-titulo"
    >
      <div className="proposta-convite">
        <div className="proposta-convite-texto">
          <h2 id="proposta-titulo" className="proposta-titulo titulo-display">
            <span className="linha">
              <span className="linha-interna entrada">Seja</span>
            </span>{' '}
            <span className="linha">
              <span className="linha-interna entrada">
                <em className="peso">Semog.</em>
              </span>
            </span>
          </h2>
        </div>
      </div>
      <div className="proposta-metade-form">
        <FormularioProposta
          id="proposta-form"
          classe="proposta-form"
          comEntrada
          ufInicial={ufInicial}
          perfilInicial={perfilInicial}
        />
      </div>
    </section>
  )
}
