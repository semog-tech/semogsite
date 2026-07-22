import type { Metadata } from 'next'
import { CityLanding } from '@/components/city/CityLanding'
import { CITY_LANDINGS } from '@/data/cityLandings'
import { absoluteUrl, cityLandingJsonLd } from '@/lib/seo'

const data = CITY_LANDINGS['campina-grande']
const description = `Administradora de condomínios em ${data.city}/${data.uf}: gestão local, prestação de contas 100% digital, aplicativo e Semog Garante. Peça sua proposta em até 24h.`

export const metadata: Metadata = {
  title: `Administradora de Condomínios em ${data.city} | Semog`,
  description,
  alternates: { canonical: absoluteUrl(data.slug) },
  openGraph: {
    type: 'website',
    url: absoluteUrl(data.slug),
    title: `Administradora de Condomínios em ${data.city} | Semog`,
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
