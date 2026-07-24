import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { pages } from '@/../content/pages'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { getPageBySlug, getSiteSettings } from '@/lib/content'
import { buildMetadata, getPageJsonLd } from '@/lib/seo'

// Sem `revalidate`: a página é 100% estática agora (conteúdo vem de
// `content/pages`, não do banco) — nada a revalidar em runtime.

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
      // Canonical e openGraph são omitidos intencionalmente: um 404 não deve emitir canonical apontando para si ou OG image.
      return { title: 'Página não encontrada — Semog', description: undefined }
    }
    return buildMetadata({ doc: page, settings, path })
  } catch {
    // `content.ts` não faz I/O (não deveria lançar), mas mantém o fallback
    // defensivo: um erro inesperado aqui não deve derrubar o `<head>` da página.
    return buildMetadata({ doc: null, settings: null, path })
  }
}

/** Todas as rotas do catch-all vêm do índice estático `content/pages` — sem chamada ao banco. */
export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({
    slug: slug === 'home' ? [] : slug.split('/'),
  }))
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const path = slug?.join('/') || 'home'
  const page = await getPageBySlug(path)
  if (!page) notFound()
  // JSON-LD por tipo de página: Organization (home), LocalBusiness+FAQPage+
  // BreadcrumbList (landings de cidade) ou BreadcrumbList (demais). Ver `getPageJsonLd`.
  const jsonLd = getPageJsonLd({ page, path })
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD derivado do CMS/dados estáticos, sem input de usuário
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <RenderBlocks blocks={page.layout} />
    </>
  )
}
