import { CenasDaHome } from '@/site/cenas/paginas/home'
import { EsqueletoApp } from '@/site/layout/EsqueletoApp'
import { JsonLd } from '@/site/secoes/comum/JsonLd'
import { Abertura } from '@/site/secoes/home/Abertura'
import { Comunidade } from '@/site/secoes/home/Comunidade'
import { Condominios } from '@/site/secoes/home/Condominios'
import { Pilares } from '@/site/secoes/home/Pilares'
import { Ranking } from '@/site/secoes/home/Ranking'
import { Tecnologia } from '@/site/secoes/home/Tecnologia'
import { Unidades } from '@/site/secoes/home/Unidades'
import { SecaoProposta } from '@/site/secoes/proposta/SecaoProposta'
import { jsonLdInstitucional } from '@/site/seo/institucional'

/** Corpo da home do site v2 (index.html do protótipo). A virada 1 leva este corpo a "/". */
export function PaginaHome() {
  return (
    <EsqueletoApp pagina="home" temProposta cenas={<CenasDaHome />}>
      <JsonLd dados={jsonLdInstitucional('home')} />
      <Abertura />
      <Condominios />
      <Pilares />
      <Tecnologia />
      <Ranking />
      <Unidades />
      <Comunidade />
      <SecaoProposta />
    </EsqueletoApp>
  )
}
