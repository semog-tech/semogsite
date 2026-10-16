import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllPosts } from '@/lib/blog'
import { metadadosDoPost } from '@/site/leitura/metadados'
import { PaginaDoPost } from '@/site/paginas/leitura'
import { previaLiberada, ROBOTS_DA_PREVIA } from '@/site/previa'

type Props = { params: Promise<{ slug: string }> }

/** Um caminho por post; slug fora da lista é 404 sem renderizar nada. */
export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}
export const dynamicParams = false

/** O <head> do /blog/<slug> de hoje (mesma função); só a prévia ganha noindex. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return { ...metadadosDoPost(slug), robots: ROBOTS_DA_PREVIA }
}

/** Post no visual de leitura, na prévia. 404 em produção; vai para /blog/<slug> na virada 1. */
export default async function Pagina({ params }: Props) {
  if (!previaLiberada()) notFound()
  const { slug } = await params
  return <PaginaDoPost slug={slug} />
}
