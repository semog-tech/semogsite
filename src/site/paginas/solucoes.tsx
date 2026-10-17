import { CenasDasSolucoes } from '@/site/cenas/paginas/solucoes'
import { conteudo } from '@/site/conteudo/conteudo'
import { EsqueletoApp } from '@/site/layout/EsqueletoApp'
import { caminhoNoSite } from '@/site/rotas'
import { JsonLd } from '@/site/secoes/comum/JsonLd'
import { SecaoProposta } from '@/site/secoes/proposta/SecaoProposta'
import { AberturaDeSolucoes } from '@/site/secoes/solucoes/AberturaDeSolucoes'
import { BlocoDeSolucao } from '@/site/secoes/solucoes/BlocoDeSolucao'
import { PerguntasDeSolucoes } from '@/site/secoes/solucoes/PerguntasDeSolucoes'
import { PorqueSemog } from '@/site/secoes/solucoes/PorqueSemog'
import { TiposDeCondominio } from '@/site/secoes/solucoes/TiposDeCondominio'
import { jsonLdInstitucional } from '@/site/seo/institucional'

/** Corpo de /solucoes (a página no ar, reescrita e no visual v2). Fora do menu, como no protótipo. */
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
          tema: 'gelo',
          titulo: s.prestacao.titulo,
          texto: s.prestacao.texto,
          itens: s.prestacao.itens,
          link: { href: caminhoNoSite('/tecnologia'), rotulo: s.prestacao.link },
        }}
      />
      <BlocoDeSolucao
        bloco={{
          id: 'garante',
          tema: 'claro',
          titulo: s.garante.titulo,
          texto: s.garante.texto,
          itens: s.garante.itens,
          destaque: s.garante.custo,
          link: { href: caminhoNoSite('/garante'), rotulo: s.garante.link },
        }}
      />
      <BlocoDeSolucao
        bloco={{
          id: 'aplicativo',
          tema: 'gelo',
          titulo: s.aplicativo.titulo,
          texto: s.aplicativo.texto,
          itens: s.aplicativo.itens,
        }}
      />
      <BlocoDeSolucao
        bloco={{
          id: 'software-de-dono',
          tema: 'claro',
          titulo: s.tecnologia.titulo,
          texto: s.tecnologia.texto,
          itens: s.tecnologia.itens,
          link: { href: caminhoNoSite('/tecnologia'), rotulo: s.tecnologia.link },
        }}
      />
      <BlocoDeSolucao
        bloco={{
          id: 'beneficios',
          tema: 'gelo',
          titulo: s.clube.titulo,
          texto: s.clube.texto,
          itens: [],
        }}
      />
      <PerguntasDeSolucoes />
      <SecaoProposta />
    </EsqueletoApp>
  )
}
