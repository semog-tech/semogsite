import type React from 'react'
import { CookieBanner } from '@/components/consent/CookieBanner'
import { FooterServer } from '@/components/layout/FooterServer'
import { HeaderServer } from '@/components/layout/HeaderServer'
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
        <ConsentProvider>
          <LenisProvider>
            <HeaderServer />
            <main>{children}</main>
            <FooterServer />
          </LenisProvider>
          <CookieBanner />
        </ConsentProvider>
      </body>
    </html>
  )
}
