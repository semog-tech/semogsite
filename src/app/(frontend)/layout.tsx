import type { Metadata } from 'next'
import type React from 'react'
import { Analytics } from '@/components/analytics/Analytics'
import { AttributionTracker } from '@/components/analytics/AttributionTracker'
import { Clarity } from '@/components/analytics/Clarity'
import { LeadClickTracker } from '@/components/analytics/LeadClickTracker'
import { FooterServer } from '@/components/layout/FooterServer'
import { Grain } from '@/components/layout/Grain'
import { HeaderServer } from '@/components/layout/HeaderServer'
import { Preloader } from '@/components/layout/Preloader'
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat'
import { siteUrl } from '@/lib/seo'
import { ConsentProvider } from '@/providers/ConsentProvider'
import { clash, satoshi } from '../../fonts'
import { LenisProvider } from '../../motion/LenisProvider'
import '../../styles/theme.css'

export const metadata: Metadata = {
  // Base das URLs relativas de metadata declaradas nas páginas deste grupo.
  // As do `buildMetadata` já saem absolutas (o Next ignora a base nesse caso);
  // efeito visível hoje: o canonical da home sai sem a barra final, forma
  // equivalente para o Google. NÃO conserta a `og:image` de `/styleguide` e do
  // 404: ela vem de `src/app/opengraph-image.tsx`, acima dos root layouts, e é
  // resolvida antes desta base (em produção a Vercel completa com o domínio).
  // Cada root layout (`(frontend)`, `(evento)`, `(interno)`) precisa da sua:
  // não herdam entre si.
  metadataBase: new URL(siteUrl()),
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
          <Clarity />
          <AttributionTracker />
          <LeadClickTracker />
          <LenisProvider>
            <HeaderServer />
            <main id="conteudo">{children}</main>
            <FooterServer />
          </LenisProvider>
        </ConsentProvider>
        <WhatsAppFloat />
      </body>
    </html>
  )
}
