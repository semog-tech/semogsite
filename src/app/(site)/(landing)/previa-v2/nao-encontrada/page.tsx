import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { METADADOS_DA_404, PaginaNaoEncontrada } from '@/site/paginas/nao-encontrada'
import { previaLiberada } from '@/site/previa'

export const metadata: Metadata = METADADOS_DA_404

/** A 404 nova vista na prévia, com status 200 (para olhar e fotografar). 404 de verdade em produção. */
export default function Pagina() {
  if (!previaLiberada()) notFound()
  return <PaginaNaoEncontrada />
}
