import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginaSemog } from '@/site/paginas/semog'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'
import { metadadosInstitucionais } from '@/site/seo/institucional'

export const metadata: Metadata = { ...metadadosInstitucionais('semog'), robots: ROBOTS_DA_PREVIA }

/** A Semog do site v2 na prévia. 404 em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaSemog />
}
