import type { Metadata } from 'next'
import { CityLanding } from '@/components/city/CityLanding'
import { CITY_LANDINGS } from '@/data/cityLandings'
import { absoluteUrl, cityLandingJsonLd } from '@/lib/seo'

const data = CITY_LANDINGS['joao-pessoa']
// Título e descrição vêm de `CITY_LANDINGS`, escritos um a um por cidade: o
// template com o topônimo trocado que ficava aqui dava às quatro landings a
// mesma descrição, repetindo o título dentro dela.
const { title, description } = data.meta

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl(data.slug) },
  openGraph: {
    type: 'website',
    url: absoluteUrl(data.slug),
    title,
    description,
    images: [absoluteUrl(data.image)],
  },
}

export default function Page() {
  const jsonLd = cityLandingJsonLd(data.slug, data.faq)
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD serializado por nós, sem input de usuário
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <CityLanding data={data} />
    </>
  )
}
