import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EsqueletoApp } from '@/site/layout/EsqueletoApp'
import { previaLiberada } from '@/site/previa'
import { Ranking } from '@/site/secoes/home/Ranking'
import { SecaoProposta } from '@/site/secoes/proposta/SecaoProposta'

export const metadata: Metadata = {
  title: 'Prévia do site v2 · Semog',
  // O layout (site) não define título nem descrição: cada página declara os seus.
  description: 'Bancada interna da fundação do site v2 da Semog. Não é uma página pública.',
  robots: { index: false, follow: false },
}

/** Bancada da fundação e dos formulários: a cena do ranking e o pedido de proposta em duas etapas. 404 em produção (src/site/previa.ts). */
export default function PaginaPrevia() {
  if (!previaLiberada()) notFound()
  return (
    <EsqueletoApp pagina="previa" temProposta>
      <Ranking />
      <SecaoProposta />
    </EsqueletoApp>
  )
}
