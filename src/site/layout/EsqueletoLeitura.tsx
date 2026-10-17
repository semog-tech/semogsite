import type React from 'react'
import { PainelSouCliente } from '@/site/cliente/PainelSouCliente'
import { LigarLeitura } from '@/site/leitura/LigarLeitura'
import { Cabecalho, type IdNav } from './Cabecalho'
import { Rodape } from './Rodape'
import { SimbolosSvg } from './SimbolosSvg'

export type PaginaDeLeitura = 'blog' | 'post' | 'privacidade' | 'termos'

type PropsEsqueleto = { pagina: PaginaDeLeitura; atual?: IdNav; children: React.ReactNode }

/**
 * Esqueleto do pacote leitura: o mesmo cabeçalho e rodapé do pacote app, sem runner de cenas e
 * sem Lenis. Toda página de leitura tem o pedido de proposta (#proposta) no fim, como no protótipo.
 */
export function EsqueletoLeitura({ pagina, atual, children }: PropsEsqueleto) {
  return (
    <>
      <SimbolosSvg />
      <a className="pular" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho atual={atual} destinoProposta="#proposta" />
      <main id="conteudo" data-pagina={pagina}>
        {children}
      </main>
      <Rodape destinoProposta="#proposta" />
      <PainelSouCliente segundaViaAtiva={process.env.SEGUNDA_VIA_ATIVA === 'true'} />
      <LigarLeitura />
    </>
  )
}
