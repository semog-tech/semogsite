import { CenasDasSolucoes } from '@/site/cenas/paginas/solucoes'
import { conteudo } from '@/site/conteudo/conteudo'
import { EsqueletoApp } from '@/site/layout/EsqueletoApp'
import { caminhoNoSite } from '@/site/rotas'
import { JsonLd } from '@/site/secoes/comum/JsonLd'
import { SecaoProposta } from '@/site/secoes/proposta/SecaoProposta'
import { AberturaDeSolucoes } from '@/site/secoes/solucoes/AberturaDeSolucoes'
import { AplicativoEBeneficios } from '@/site/secoes/solucoes/AplicativoEBeneficios'
import { BlocoDeSolucao } from '@/site/secoes/solucoes/BlocoDeSolucao'
import { GaranteNasSolucoes } from '@/site/secoes/solucoes/GaranteNasSolucoes'
import { PerguntasDeSolucoes } from '@/site/secoes/solucoes/PerguntasDeSolucoes'
import { PorqueSemog } from '@/site/secoes/solucoes/PorqueSemog'
import { TiposDeCondominio } from '@/site/secoes/solucoes/TiposDeCondominio'
import { jsonLdInstitucional } from '@/site/seo/institucional'

/**
 * Corpo de /solucoes (a página no ar, reescrita e no visual v2). Fora do menu, como no protótipo.
 * Ritmo: branco, gelo, branco, gelo, o marinho do Garante, branco, gelo, branco e a proposta. Um
 * só link para a Tecnologia, no software, que é dela.
 */
export function PaginaSolucoes() {
  const s = conteudo.solucoesPagina
  return (
    <EsqueletoApp pagina="solucoes" temProposta cenas={<CenasDasSolucoes />}>
      <JsonLd dados={jsonLdInstitucional('solucoes')} />
      <AberturaDeSolucoes />
      <TiposDeCondominio />
      <PorqueSemog />
      <BlocoDeSolucao
        bloco={{
          id: 'prestacao',
          titulo: s.prestacao.titulo,
          texto: s.prestacao.texto,
          itens: s.prestacao.itens,
        }}
      />
      <GaranteNasSolucoes />
      <AplicativoEBeneficios />
      <BlocoDeSolucao
        bloco={{
          id: 'software-de-dono',
          titulo: s.tecnologia.titulo,
          texto: s.tecnologia.texto,
          itens: s.tecnologia.itens,
          link: { href: caminhoNoSite('/tecnologia'), rotulo: s.tecnologia.link },
        }}
      />
      <PerguntasDeSolucoes />
      <SecaoProposta />
    </EsqueletoApp>
  )
}
