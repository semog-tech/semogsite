import { CenasDaTecnologia } from '@/site/cenas/paginas/tecnologia'
import { EsqueletoApp } from '@/site/layout/EsqueletoApp'
import { JsonLd } from '@/site/secoes/comum/JsonLd'
import { SecaoProposta } from '@/site/secoes/proposta/SecaoProposta'
import { AberturaDaTecnologia } from '@/site/secoes/tecnologia/Abertura'
import { Conferencia } from '@/site/secoes/tecnologia/Conferencia'
import { Evolucao } from '@/site/secoes/tecnologia/Evolucao'
import { UmMesDeCondominio } from '@/site/secoes/tecnologia/Mes'
import { jsonLdInstitucional } from '@/site/seo/institucional'

/** Corpo da Tecnologia (tecnologia.html do protótipo), URL nova. A virada 1 o leva a /tecnologia. */
export function PaginaTecnologia() {
  return (
    <EsqueletoApp pagina="tecnologia" atual="tecnologia" temProposta cenas={<CenasDaTecnologia />}>
      <JsonLd dados={jsonLdInstitucional('tecnologia')} />
      <AberturaDaTecnologia />
      <UmMesDeCondominio />
      <Evolucao />
      <Conferencia />
      <SecaoProposta />
    </EsqueletoApp>
  )
}
