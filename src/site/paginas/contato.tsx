import { EsqueletoLanding } from '@/site/layout/EsqueletoLanding'
import { JsonLd } from '@/site/secoes/comum/JsonLd'
import { AberturaDoContato } from '@/site/secoes/contato/Abertura'
import { MensagemDoContato } from '@/site/secoes/contato/Mensagem'
import { UnidadesDoContato } from '@/site/secoes/contato/Unidades'
import { jsonLdInstitucional } from '@/site/seo/institucional'

/** Corpo do Contato (contato.html do protótipo). A virada 1 o leva a /contato. */
export function PaginaContato() {
  return (
    <EsqueletoLanding pagina="contato" atual="contato">
      <JsonLd dados={jsonLdInstitucional('contato')} />
      <AberturaDoContato />
      <UnidadesDoContato />
      <MensagemDoContato />
    </EsqueletoLanding>
  )
}
