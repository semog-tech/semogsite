import { EsqueletoLanding } from '@/site/layout/EsqueletoLanding'
import { JsonLd } from '@/site/secoes/comum/JsonLd'
import { DepoisDoPedido } from '@/site/secoes/proposta-pagina/Depois'
import { PedidoDeProposta } from '@/site/secoes/proposta-pagina/Pedido'
import { jsonLdInstitucional } from '@/site/seo/institucional'

/** Corpo da página de proposta (proposta.html do protótipo). A virada 1 o leva a /proposta. */
export function PaginaProposta() {
  return (
    <EsqueletoLanding pagina="proposta">
      <JsonLd dados={jsonLdInstitucional('proposta')} />
      <PedidoDeProposta />
      <DepoisDoPedido />
    </EsqueletoLanding>
  )
}
