import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EsqueletoApp } from '@/site/layout/EsqueletoApp'
import { previaLiberada } from '@/site/previa'
import { Ranking } from '@/site/secoes/home/Ranking'

export const metadata: Metadata = {
  title: 'Prévia do site v2 · Semog',
  // O layout (site) não define título nem descrição: cada página declara os seus.
  description: 'Bancada interna da fundação do site v2 da Semog. Não é uma página pública.',
  robots: { index: false, follow: false },
}

/** Bancada da fundação: a cena do ranking dentro do Next. 404 em produção (src/site/previa.ts). */
export default function PaginaPrevia() {
  if (!previaLiberada()) notFound()
  return (
    <EsqueletoApp pagina="previa" temProposta={false}>
      <Ranking />
    </EsqueletoApp>
  )
}
