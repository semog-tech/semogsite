import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginaProposta } from '@/site/paginas/proposta'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'
import { metadadosInstitucionais } from '@/site/seo/institucional'

export const metadata: Metadata = {
  ...metadadosInstitucionais('proposta'),
  robots: ROBOTS_DA_PREVIA,
}

/** Página de proposta do site v2 na prévia (pacote landing). 404 em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaProposta />
}
