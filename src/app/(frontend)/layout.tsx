import type React from 'react'
import { Analytics } from '@/components/analytics/Analytics'
import { AttributionTracker } from '@/components/analytics/AttributionTracker'
import { LeadClickTracker } from '@/components/analytics/LeadClickTracker'
import { CookieBanner } from '@/components/consent/CookieBanner'
import { FooterServer } from '@/components/layout/FooterServer'
import { Grain } from '@/components/layout/Grain'
import { HeaderServer } from '@/components/layout/HeaderServer'
import { Preloader } from '@/components/layout/Preloader'
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat'
import { ConsentProvider } from '@/providers/ConsentProvider'
import { clash, satoshi } from '../../fonts'
import { LenisProvider } from '../../motion/LenisProvider'
import '../../styles/theme.css'

export const metadata = {
  description: 'Semog Administradora de Condomínios — site institucional.',
  title: 'Semog Administradora de Condomínios',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html className={`${clash.variable} ${satoshi.variable}`} lang="pt-BR">
      <body>
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <Preloader />
        <Grain />
        <ConsentProvider>
          <Analytics />
          <AttributionTracker />
          <LeadClickTracker />
          <LenisProvider>
            <HeaderServer />
            <main id="conteudo">{children}</main>
            <FooterServer />
          </LenisProvider>
          <CookieBanner />
        </ConsentProvider>
        <WhatsAppFloat />
      </body>
    </html>
  )
}
