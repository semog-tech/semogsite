import { CenasDaGestao } from '@/site/cenas/paginas/gestao'
import { EsqueletoApp } from '@/site/layout/EsqueletoApp'
import { JsonLd } from '@/site/secoes/comum/JsonLd'
import { AberturaDaGestao } from '@/site/secoes/gestao/Abertura'
import { QuemAtende } from '@/site/secoes/gestao/Atende'
import { MesaDoSindico } from '@/site/secoes/gestao/Mesa'
import { PerguntasDaGestao } from '@/site/secoes/gestao/Perguntas'
import { TrocaDeAdministradora } from '@/site/secoes/gestao/Troca'
import { SecaoProposta } from '@/site/secoes/proposta/SecaoProposta'
import { jsonLdInstitucional } from '@/site/seo/institucional'

/** Corpo da Gestão (administracao-de-condominios.html do protótipo). A virada 1 o leva à URL real. */
export function PaginaGestao() {
  return (
    <EsqueletoApp pagina="gestao" atual="gestao" temProposta cenas={<CenasDaGestao />}>
      <JsonLd dados={jsonLdInstitucional('administracao-de-condominios')} />
      <AberturaDaGestao />
      <MesaDoSindico />
      <QuemAtende />
      <TrocaDeAdministradora />
      <PerguntasDaGestao />
      <SecaoProposta />
    </EsqueletoApp>
  )
}
