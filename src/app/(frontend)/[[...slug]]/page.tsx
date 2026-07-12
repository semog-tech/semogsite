import { notFound } from 'next/navigation'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { getPageBySlug } from '@/lib/payload'

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const path = slug?.join('/') || 'home'
  const page = await getPageBySlug(path)
  if (!page) notFound()
  return <RenderBlocks blocks={page.layout} />
}
