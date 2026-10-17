import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginaContato } from '@/site/paginas/contato'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'
import { metadadosInstitucionais } from '@/site/seo/institucional'

export const metadata: Metadata = {
  ...metadadosInstitucionais('contato'),
  robots: ROBOTS_DA_PREVIA,
}

/** Contato do site v2 na prévia (pacote landing). 404 em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaContato />
}
