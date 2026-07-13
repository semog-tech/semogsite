import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { getPageBySlug, getPayloadClient, getSiteSettings } from '@/lib/payload'
import { buildMetadata, getOrganizationJsonLd } from '@/lib/seo'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}): Promise<Metadata> {
  const { slug } = await params
  const path = slug?.join('/') || 'home'
  try {
    const [page, settings] = await Promise.all([getPageBySlug(path), getSiteSettings()])
    // Sem página publicada nesse slug: `notFound()` (abaixo, no body) renderiza
    // o `not-found.tsx` do grupo, mas o <head> já foi resolvido aqui — sem
    // isso, a aba mostraria o título genérico do site (via fallback de
    // `buildMetadata`) numa página de erro 404.
    if (!page) {
      return { title: 'Página não encontrada — Semog', description: undefined }
    }
    return buildMetadata({ doc: page, settings, path })
  } catch {
    // DB indisponível — não derruba o render, cai no fallback embutido em `buildMetadata`.
    return buildMetadata({ doc: null, settings: null, path })
  }
}

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
  return (
    <>
      {path === 'home' && (
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD estático (sem input de usuário), gerado por getOrganizationJsonLd
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getOrganizationJsonLd()) }}
        />
      )}
      <RenderBlocks blocks={page.layout} />
    </>
  )
}
