import { CenasDaSemog } from '@/site/cenas/paginas/semog'
import { EsqueletoApp } from '@/site/layout/EsqueletoApp'
import { JsonLd } from '@/site/secoes/comum/JsonLd'
import { SecaoProposta } from '@/site/secoes/proposta/SecaoProposta'
import { Assembleia } from '@/site/secoes/semog/Assembleia'
import { Depoimentos } from '@/site/secoes/semog/Depoimentos'
import { Historia } from '@/site/secoes/semog/Historia'
import { Manifesto } from '@/site/secoes/semog/Manifesto'
import { Pessoas } from '@/site/secoes/semog/Pessoas'
import { Principios } from '@/site/secoes/semog/Principios'
import { jsonLdInstitucional } from '@/site/seo/institucional'

/** Corpo de A Semog (semog.html do protótipo). A virada 1 leva este corpo a /semog. */
export function PaginaSemog() {
  return (
    <EsqueletoApp pagina="semog" atual="semog" temProposta cenas={<CenasDaSemog />}>
      <JsonLd dados={jsonLdInstitucional('semog')} />
      <Manifesto />
      <Historia />
      <Principios />
      <Pessoas />
      <Depoimentos />
      <Assembleia />
      <SecaoProposta />
    </EsqueletoApp>
  )
}
