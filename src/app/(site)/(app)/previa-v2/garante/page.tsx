import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginaGarante } from '@/site/paginas/garante'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'
import { metadadosInstitucionais } from '@/site/seo/institucional'

export const metadata: Metadata = {
  ...metadadosInstitucionais('garante'),
  robots: ROBOTS_DA_PREVIA,
}

/** Semog Garante do site v2 na prévia. 404 em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaGarante />
}
