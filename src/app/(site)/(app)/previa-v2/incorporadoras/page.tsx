import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginaIncorporadoras } from '@/site/paginas/incorporadoras'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'
import { metadadosInstitucionais } from '@/site/seo/institucional'

export const metadata: Metadata = {
  ...metadadosInstitucionais('incorporadoras'),
  robots: ROBOTS_DA_PREVIA,
}

/** Incorporadoras do site v2 na prévia. 404 em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaIncorporadoras />
}
