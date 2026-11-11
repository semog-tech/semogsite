import type { Metadata } from 'next'
import { BlackFridayLanding } from '@/components/campanha/BlackFridayLanding'
import { BLACK_FRIDAY_SLUG } from '@/lib/blackFriday'
import { absoluteUrl } from '@/lib/seo'

const title = 'Black Friday Semog | Primeira taxa de administração só em fevereiro de 2027'
const description =
  'Feche com a Semog nesta Black Friday e só pague a primeira taxa de administração do seu condomínio em fevereiro de 2027. Válido para os 10 primeiros condomínios.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl(BLACK_FRIDAY_SLUG) },
  openGraph: {
    type: 'website',
    url: absoluteUrl(BLACK_FRIDAY_SLUG),
    title,
    description,
  },
}

export default function Page() {
  return <BlackFridayLanding />
}
