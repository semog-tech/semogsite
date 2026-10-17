import { CenasDoGarante } from '@/site/cenas/paginas/garante'
import { EsqueletoApp } from '@/site/layout/EsqueletoApp'
import { JsonLd } from '@/site/secoes/comum/JsonLd'
import { AberturaDoGarante } from '@/site/secoes/garante/Abertura'
import { CaixaDoCondominio } from '@/site/secoes/garante/Caixa'
import { DuvidasDoGarante } from '@/site/secoes/garante/Duvidas'
import { Papeis } from '@/site/secoes/garante/Papeis'
import { SecaoProposta } from '@/site/secoes/proposta/SecaoProposta'
import { jsonLdInstitucional } from '@/site/seo/institucional'

/** Corpo do Semog Garante (garante.html do protótipo). A virada 1 o leva a /garante. */
export function PaginaGarante() {
  return (
    <EsqueletoApp pagina="garante" atual="garante" temProposta cenas={<CenasDoGarante />}>
      <JsonLd dados={jsonLdInstitucional('garante')} />
      <AberturaDoGarante />
      <CaixaDoCondominio />
      <Papeis />
      <DuvidasDoGarante />
      <SecaoProposta />
    </EsqueletoApp>
  )
}
