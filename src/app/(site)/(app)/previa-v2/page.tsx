import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginaHome } from '@/site/paginas/home'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'
import { metadadosInstitucionais } from '@/site/seo/institucional'

export const metadata: Metadata = { ...metadadosInstitucionais('home'), robots: ROBOTS_DA_PREVIA }

/** A home do site v2 na prévia (substitui a bancada da fundação). 404 em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaHome />
}
