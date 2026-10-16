import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { metadadosDaPagina } from '@/site/leitura/metadados'
import { PaginaDoBlog } from '@/site/paginas/leitura'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'

/** O <head> do /blog de hoje (mesma função); só a prévia ganha noindex. */
export const metadata: Metadata = { ...metadadosDaPagina('blog'), robots: ROBOTS_DA_PREVIA }

/** Índice do blog no visual de leitura, na prévia. 404 em produção; vai para /blog na virada 1. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaDoBlog />
}
