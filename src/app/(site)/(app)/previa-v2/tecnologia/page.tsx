import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginaTecnologia } from '@/site/paginas/tecnologia'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'
import { metadadosInstitucionais } from '@/site/seo/institucional'

export const metadata: Metadata = {
  ...metadadosInstitucionais('tecnologia'),
  robots: ROBOTS_DA_PREVIA,
}

/** Tecnologia do site v2 na prévia (URL nova). 404 em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaTecnologia />
}
