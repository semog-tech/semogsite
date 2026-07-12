import { notFound } from 'next/navigation'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { getPageBySlug, getPayloadClient } from '@/lib/payload'

export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'pages',
      where: { _status: { equals: 'published' } },
      limit: 1000,
      depth: 0,
    })
    return res.docs.map((doc) => ({
      slug: doc.slug === 'home' ? [] : doc.slug.split('/'),
    }))
  } catch {
    return []
  }
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const path = slug?.join('/') || 'home'
  const page = await getPageBySlug(path)
  if (!page) notFound()
  return <RenderBlocks blocks={page.layout} />
}
