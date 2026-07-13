import type { Metadata } from 'next'
import type { Media, SiteSettings } from '@/payload-types'

const DEFAULT_SITE_URL = 'https://www.semog.com.br'
const FALLBACK_TITLE = 'Semog Administradora de Condomínios'

/**
 * Forma compartilhada do grupo `meta` que o `@payloadcms/plugin-seo` injeta
 * em `Page` e `Post` (título/descrição/imagem) — evita depender do tipo
 * gerado de uma collection específica.
 */
export interface SeoMeta {
  title?: string | null
  description?: string | null
  image?: (number | null) | Media
}

export interface SeoDoc {
  title?: string | null
  meta?: SeoMeta | null
}

/** Base URL do site (sem trailing slash), fonte única para `absoluteUrl` e `robots.ts`. */
export function siteUrl(): string {
  const v = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  return (v ? v : DEFAULT_SITE_URL).replace(/\/+$/, '')
}

/** Monta uma URL absoluta a partir de um path relativo (`/solucoes`, `solucoes`, `''`/`home`). */
export function absoluteUrl(path: string): string {
  const base = siteUrl().replace(/\/+$/, '')
  const normalized = path.replace(/^\/+/, '')
  if (normalized === '' || normalized === 'home') return `${base}/`
  return `${base}/${normalized}`
}

/** Resolve o `Media` populado (não só a URL) — precisamos de `width`/`height` próprios em `buildMetadata`. */
function resolveImageSource(
  image: SeoMeta['image'] | undefined,
  fallback?: SeoMeta['image'],
): Media | undefined {
  const source = image && typeof image === 'object' ? image : fallback
  if (source && typeof source === 'object' && source.url) return source
  return undefined
}

/**
 * URL absoluta da rota OG dinâmica (`next/og`) correspondente a um `path`.
 * Usada como fallback de `openGraph.images`/`twitter.images` quando o doc não
 * tem uma imagem de SEO própria — espelha as rotas `opengraph-image.tsx` em
 * `src/app/` (raiz), não `src/app/(frontend)/`: `''`/`'home'` → o card
 * default (`src/app/opengraph-image.tsx`); qualquer outro path →
 * `<path>/opengraph-image` (cobre tanto pages, `path` = slug único →
 * `src/app/[slug]/opengraph-image.tsx`, quanto posts, `path` = `blog/<slug>`
 * → `src/app/blog/[slug]/opengraph-image.tsx`).
 */
function dynamicOgImageUrl(path: string): string {
  const normalized = path.replace(/^\/+/, '')
  if (normalized === '' || normalized === 'home') return absoluteUrl('opengraph-image')
  return absoluteUrl(`${normalized}/opengraph-image`)
}

/**
 * Monta o objeto `Metadata` do Next a partir do `meta` do doc (Page/Post,
 * populado pelo plugin-seo), com fallback pro título/descrição padrão do
 * global `SiteSettings` e, por fim, pro título bruto do doc.
 *
 * Nunca lança — chamado a partir de `generateMetadata`, que não deve
 * derrubar o render da página caso o doc ou o global estejam ausentes.
 */
export function buildMetadata({
  doc,
  settings,
  path,
  ogType = 'website',
}: {
  doc?: SeoDoc | null
  settings?: SiteSettings | null
  path: string
  ogType?: 'website' | 'article'
}): Metadata {
  // `doc.title` é o rótulo bruto do admin (ex.: "Soluções"), sem marca — só
  // esse ramo do fallback precisa do sufixo. `meta.title` e
  // `settings.defaultTitle` já vêm completos (preenchidos com a marca por
  // quem cadastra o SEO).
  const title = doc?.meta?.title
    ? doc.meta.title
    : doc?.title
      ? `${doc.title} | ${FALLBACK_TITLE}`
      : settings?.defaultTitle || FALLBACK_TITLE
  const description = doc?.meta?.description || settings?.defaultDescription || undefined
  const uploadedImage = resolveImageSource(doc?.meta?.image, settings?.ogImage)
  const canonical = absoluteUrl(path)
  // 1200x630 é a dimensão fixa da nossa rota OG dinâmica (`next/og`) — uma
  // imagem enviada pelo CMS pode ter proporção diferente, então só herda
  // dims quando o próprio `Media` as informa (senão omite e deixa o
  // consumidor inferir do arquivo).
  const ogImages = uploadedImage
    ? [
        {
          url: uploadedImage.url as string,
          ...(uploadedImage.width && uploadedImage.height
            ? { width: uploadedImage.width, height: uploadedImage.height }
            : {}),
        },
      ]
    : [{ url: dynamicOgImageUrl(path), width: 1200, height: 630 }]

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: ogType,
      siteName: FALLBACK_TITLE,
      locale: 'pt_BR',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      images: ogImages,
    },
  }
}

/**
 * JSON-LD `Organization` + `WebSite` (schema.org `@graph`) exibido na home —
 * espelha `_reference/index.html` (fatos válidos em 2026: fundada em 1991 →
 * 35 anos de mercado, 700 condomínios, 70 mil clientes). Estático porque
 * esses dados não vêm do CMS ainda; a URL base segue `NEXT_PUBLIC_SITE_URL`
 * para funcionar em outros ambientes (preview/staging).
 */
export function getOrganizationJsonLd(): Record<string, unknown> {
  const root = absoluteUrl('')
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${root}#org`,
        name: FALLBACK_TITLE,
        url: root,
        logo: absoluteUrl('semog-logo-light.svg'),
        foundingDate: '1991',
        slogan: 'Preocupe-se apenas em morar',
        description:
          'Administradora de condomínios líder do Nordeste, com 35 anos de mercado, mais de 700 condomínios administrados e 70 mil clientes.',
        numberOfEmployees: { '@type': 'QuantitativeValue', value: 100 },
        areaServed: ['Recife', 'João Pessoa', 'Campina Grande', 'Belém'],
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Recife',
          addressRegion: 'PE',
          addressCountry: 'BR',
        },
        subOrganization: [
          {
            '@type': 'LocalBusiness',
            name: 'Semog João Pessoa',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'João Pessoa',
              addressRegion: 'PB',
              addressCountry: 'BR',
            },
          },
          {
            '@type': 'LocalBusiness',
            name: 'Semog Campina Grande',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Campina Grande',
              addressRegion: 'PB',
              addressCountry: 'BR',
            },
          },
          {
            '@type': 'LocalBusiness',
            name: 'Semog Belém',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Belém',
              addressRegion: 'PA',
              addressCountry: 'BR',
            },
          },
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${root}#website`,
        url: root,
        name: FALLBACK_TITLE,
        publisher: { '@id': `${root}#org` },
        inLanguage: 'pt-BR',
      },
    ],
  }
}
