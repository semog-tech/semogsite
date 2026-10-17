import { CenasDasIncorporadoras } from '@/site/cenas/paginas/incorporadoras'
import { EsqueletoApp } from '@/site/layout/EsqueletoApp'
import { JsonLd } from '@/site/secoes/comum/JsonLd'
import { AberturaDasIncorporadoras } from '@/site/secoes/incorporadoras/Abertura'
import { Convivencia } from '@/site/secoes/incorporadoras/Convivencia'
import { Ganhos } from '@/site/secoes/incorporadoras/Ganhos'
import { Instalacao } from '@/site/secoes/incorporadoras/Instalacao'
import { Lancamento } from '@/site/secoes/incorporadoras/Lancamento'
import { Percurso } from '@/site/secoes/incorporadoras/Percurso'
import { SecaoProposta } from '@/site/secoes/proposta/SecaoProposta'
import { jsonLdInstitucional } from '@/site/seo/institucional'

/**
 * Corpo de Incorporadoras (incorporadoras.html do protótipo). Quem pede proposta daqui é, quase
 * sempre, construtora: o pedido chega com a opção marcada (e continua trocável).
 */
export function PaginaIncorporadoras() {
  return (
    <EsqueletoApp
      pagina="incorporadoras"
      atual="incorporadoras"
      temProposta
      cenas={<CenasDasIncorporadoras />}
    >
      <JsonLd dados={jsonLdInstitucional('incorporadoras')} />
      <AberturaDasIncorporadoras />
      <Convivencia />
      <Percurso />
      <Ganhos />
      <Instalacao />
      <Lancamento />
      <SecaoProposta perfilInicial="construtora" />
    </EsqueletoApp>
  )
}
