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

// ---------------------------------------------------------------------------
// NAP estruturado das 4 unidades — fonte ÚNICA do structured data local
// (LocalBusiness por página + subOrganization da home). Mantém o mesmo dado
// real do global `Company`/páginas (`src/seed/*`) e do Google Business, para
// consistência de NAP (crítico em SEO local). `telephone` em E.164.
// ---------------------------------------------------------------------------

/** WhatsApp central da Semog (atende todas as unidades), em E.164. */
const WHATSAPP_E164 = '+551130034506'

interface SeoUnit {
  slug: string
  city: string
  role: 'Matriz' | 'Filial'
  street: string
  region: string
  regionFull: string
  postalCode: string
  phoneDisplay: string
  phoneE164: string
  mapsHref: string
  areaServed: string[]
}

const UNITS: SeoUnit[] = [
  {
    slug: 'administradora-de-condominios-recife',
    city: 'Recife',
    role: 'Matriz',
    street: 'R. Bartolomeu de Gusmão, 217, Madalena',
    region: 'PE',
    regionFull: 'Pernambuco',
    postalCode: '50610-190',
    phoneDisplay: '(81) 3316-0265',
    phoneE164: '+558133160265',
    mapsHref: 'https://maps.google.com/?q=Semog+Bartolomeu+de+Gusmao+217+Madalena+Recife',
    areaServed: [
      'Recife',
      'Boa Viagem',
      'Casa Forte',
      'Madalena',
      'Olinda',
      'Jaboatão dos Guararapes',
      'Paulista',
    ],
  },
  {
    slug: 'administradora-de-condominios-joao-pessoa',
    city: 'João Pessoa',
    role: 'Filial',
    street: 'Av. Guarabira, 834, Manaíra',
    region: 'PB',
    regionFull: 'Paraíba',
    postalCode: '58038-140',
    phoneDisplay: '(83) 3224-1228',
    phoneE164: '+558332241228',
    mapsHref: 'https://maps.google.com/?q=Semog+Guarabira+834+Manaira+Joao+Pessoa',
    areaServed: [
      'João Pessoa',
      'Manaíra',
      'Tambaú',
      'Cabo Branco',
      'Bessa',
      'Cabedelo',
      'Bayeux',
      'Santa Rita',
    ],
  },
  {
    slug: 'administradora-de-condominios-campina-grande',
    city: 'Campina Grande',
    role: 'Filial',
    street: 'R. José Adnoste Roberto, 1001, Catolé',
    region: 'PB',
    regionFull: 'Paraíba',
    postalCode: '58410-193',
    phoneDisplay: '(83) 3201-9039',
    phoneE164: '+558332019039',
    mapsHref: 'https://maps.google.com/?q=Semog+Jose+Adnoste+Roberto+1001+Catole+Campina+Grande',
    areaServed: [
      'Campina Grande',
      'Catolé',
      'Mirante',
      'Alto Branco',
      'Centro',
      'Queimadas',
      'Lagoa Seca',
    ],
  },
  {
    slug: 'administradora-de-condominios-belem',
    city: 'Belém',
    role: 'Filial',
    street: 'Av. Alcindo Cacela, 2351, Sl 201, Cremação',
    region: 'PA',
    regionFull: 'Pará',
    postalCode: '66040-273',
    phoneDisplay: '(91) 3115-4700',
    phoneE164: '+559131154700',
    mapsHref: 'https://maps.google.com/?q=Semog+Alcindo+Cacela+2351+Cremacao+Belem',
    areaServed: [
      'Belém',
      'Umarizal',
      'Nazaré',
      'Batista Campos',
      'Marco',
      'Ananindeua',
      'Marituba',
    ],
  },
]

const ORG_ID = () => `${absoluteUrl('')}#org`

/** `LocalBusiness` de uma unidade, com NAP completo, horário e área atendida. */
function localBusinessNode(unit: SeoUnit): Record<string, unknown> {
  const url = absoluteUrl(unit.slug)
  return {
    '@type': 'LocalBusiness',
    '@id': `${url}#business`,
    name: `Semog ${unit.city}`,
    description: `Administradora de condomínios em ${unit.city}/${unit.region} — ${unit.role.toLowerCase()} da Semog, líder do Nordeste há 35 anos.`,
    url,
    image: absoluteUrl(`${unit.slug}/opengraph-image`),
    telephone: unit.phoneE164,
    address: {
      '@type': 'PostalAddress',
      streetAddress: unit.street,
      addressLocality: unit.city,
      addressRegion: unit.region,
      postalCode: unit.postalCode,
      addressCountry: 'BR',
    },
    areaServed: unit.areaServed,
    hasMap: unit.mapsHref,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:00',
      },
    ],
    parentOrganization: { '@id': ORG_ID() },
  }
}

/**
 * JSON-LD `Organization` + `WebSite` (schema.org `@graph`) exibido na home.
 * Fatos válidos em 2026 (fundada em 1991 → 35 anos, 700 condomínios, 70 mil
 * clientes); endereço/telefone da matriz e as 4 unidades vêm de `UNITS` (NAP
 * real). URL base segue `NEXT_PUBLIC_SITE_URL` (preview/staging).
 */
export function getOrganizationJsonLd(): Record<string, unknown> {
  const root = absoluteUrl('')
  const matriz = UNITS.find((u) => u.role === 'Matriz') ?? UNITS[0]
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
        telephone: matriz.phoneE164,
        areaServed: UNITS.map((u) => u.city),
        address: {
          '@type': 'PostalAddress',
          streetAddress: matriz.street,
          addressLocality: matriz.city,
          addressRegion: matriz.region,
          postalCode: matriz.postalCode,
          addressCountry: 'BR',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: WHATSAPP_E164,
          contactType: 'customer service',
          areaServed: 'BR',
          availableLanguage: 'Portuguese',
        },
        subOrganization: UNITS.map(localBusinessNode),
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

/** `FAQPage` a partir dos itens do bloco `Faq` da página (pergunta/resposta). */
function faqPageNode(items: { question: string; answer: string }[]): Record<string, unknown> {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

/** `BreadcrumbList` a partir de uma trilha `{name, url}`. */
function breadcrumbNode(trail: { name: string; url: string }[]): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/** Shape mínimo do que `getPageJsonLd` precisa da página (layout + título). */
interface JsonLdPage {
  title?: string | null
  layout?: unknown
}

/** Extrai os itens do primeiro bloco `Faq` do layout da página (se houver). */
function extractFaqItems(page: JsonLdPage): { question: string; answer: string }[] {
  if (!Array.isArray(page.layout)) return []
  const faq = page.layout.find(
    (block): block is { blockType: string; items?: { question?: string; answer?: string }[] } =>
      Boolean(block) &&
      typeof block === 'object' &&
      (block as { blockType?: string }).blockType === 'faq',
  )
  const items = faq?.items ?? []
  return items
    .filter((it): it is { question: string; answer: string } => Boolean(it?.question && it?.answer))
    .map((it) => ({ question: it.question, answer: it.answer }))
}

/**
 * JSON-LD (`@graph`) apropriado para uma página, por `path`:
 * - `home` → `Organization` + `WebSite` (`getOrganizationJsonLd`).
 * - landing de cidade (`administradora-de-condominios-*`) → `BreadcrumbList` +
 *   `LocalBusiness` (NAP completo de `UNITS`) + `FAQPage` (do bloco Faq).
 * - demais páginas → `BreadcrumbList` (Início › título).
 * Retorna `null` quando não há nada a emitir.
 */
export function getPageJsonLd({
  page,
  path,
}: {
  page: JsonLdPage
  path: string
}): Record<string, unknown> | null {
  if (path === 'home') return getOrganizationJsonLd()

  const root = absoluteUrl('')
  const title = page.title || FALLBACK_TITLE
  const graph: Record<string, unknown>[] = [
    breadcrumbNode([
      { name: 'Início', url: root },
      { name: title, url: absoluteUrl(path) },
    ]),
  ]

  const unit = UNITS.find((u) => u.slug === path)
  if (unit) {
    graph.push(localBusinessNode(unit))
    const faqItems = extractFaqItems(page)
    if (faqItems.length > 0) graph.push(faqPageNode(faqItems))
  }

  return { '@context': 'https://schema.org', '@graph': graph }
}

/**
 * JSON-LD (@graph) da landing de cidade renderizada por COMPONENTE próprio
 * (`CityLanding`, não CMS): BreadcrumbList + LocalBusiness (da `UNITS`, com NAP
 * + geo + areaServed) + FAQPage (as perguntas da própria página). Usado pelas
 * rotas explícitas `/administradora-de-condominios-*`.
 */
export function cityLandingJsonLd(
  slug: string,
  faq: { question: string; answer: string }[],
): Record<string, unknown> | null {
  const unit = UNITS.find((u) => u.slug === slug)
  if (!unit) return null
  const graph: Record<string, unknown>[] = [
    breadcrumbNode([
      { name: 'Início', url: absoluteUrl('') },
      { name: `Administradora de Condomínios em ${unit.city}`, url: absoluteUrl(slug) },
    ]),
    localBusinessNode(unit),
  ]
  if (faq.length > 0) graph.push(faqPageNode(faq))
  return { '@context': 'https://schema.org', '@graph': graph }
}
