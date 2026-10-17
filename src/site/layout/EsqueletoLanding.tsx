import '@/site/secoes/landing/landing.css'
import type React from 'react'
import { PainelSouCliente } from '@/site/cliente/PainelSouCliente'
import { LigarLanding } from '@/site/landing/LigarLanding'
import { Cabecalho, type IdNav } from './Cabecalho'
import { Rodape } from './Rodape'
import { SimbolosSvg } from './SimbolosSvg'

export type PaginaLanding = 'proposta' | 'contato' | 'nao-encontrada'

type PropsEsqueleto = { pagina: PaginaLanding; atual?: IdNav; children: React.ReactNode }

/**
 * Esqueleto do pacote landing (proposta, contato e 404): o cabeçalho completo do site (páginas
 * "leves" do protótipo), o rodapé e o JS da landing, sem Lenis nem runner. O CSS comum vem daqui,
 * e não de um layout do grupo, porque a 404 renderiza fora do grupo (src/app/(site)/not-found.tsx).
 */
export function EsqueletoLanding({ pagina, atual, children }: PropsEsqueleto) {
  const destinoProposta = pagina === 'proposta' ? '#proposta' : '/proposta'
  return (
    <>
      <SimbolosSvg />
      <a className="pular" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho atual={atual} destinoProposta={destinoProposta} />
      <main id="conteudo" data-pagina={pagina}>
        {children}
      </main>
      <Rodape destinoProposta={destinoProposta} />
      <PainelSouCliente segundaViaAtiva={process.env.SEGUNDA_VIA_ATIVA === 'true'} />
      <LigarLanding />
    </>
  )
}
