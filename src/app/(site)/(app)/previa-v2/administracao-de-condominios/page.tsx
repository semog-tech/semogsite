import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginaGestao } from '@/site/paginas/gestao'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'
import { metadadosInstitucionais } from '@/site/seo/institucional'

export const metadata: Metadata = {
  ...metadadosInstitucionais('administracao-de-condominios'),
  robots: ROBOTS_DA_PREVIA,
}

/** Gestão do site v2 na prévia. 404 em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaGestao />
}
