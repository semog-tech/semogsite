import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { metadadosDaPagina } from '@/site/leitura/metadados'
import { PaginaDoDocumento } from '@/site/paginas/leitura'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'

export const metadata: Metadata = { ...metadadosDaPagina('privacidade'), robots: ROBOTS_DA_PREVIA }

/** Política de Privacidade no visual de leitura, na prévia. 404 em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaDoDocumento slug="privacidade" />
}
