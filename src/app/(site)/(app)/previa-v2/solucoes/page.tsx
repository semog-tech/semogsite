import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginaSolucoes } from '@/site/paginas/solucoes'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'
import { metadadosInstitucionais } from '@/site/seo/institucional'

export const metadata: Metadata = {
  ...metadadosInstitucionais('solucoes'),
  robots: ROBOTS_DA_PREVIA,
}

/** /solucoes do site v2 na prévia. 404 em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaSolucoes />
}
