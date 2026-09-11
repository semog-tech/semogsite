import type React from 'react'
import { Analytics } from '@/components/analytics/Analytics'
import { AttributionTracker } from '@/components/analytics/AttributionTracker'
import { Clarity } from '@/components/analytics/Clarity'
import { ConsentProvider } from '@/providers/ConsentProvider'
import { clash, satoshi } from '../../fonts'
import '../../styles/theme.css'

/**
 * Root layout do route group `(evento)` — irmão de `(frontend)`, não filho.
 * Como `(frontend)/layout.tsx` já declara `<html>`/`<body>`, ele é um root
 * layout; um grupo irmão precisa declarar os seus próprios. Dois root layouts
 * é padrão suportado pelo Next, e é o que entrega a página sem header nem
 * rodapé sem gambiarra de CSS (esconder por seletor deixaria o markup, o
 * custo de JS e os links no HTML).
 *
 * A landing do Experience é peça de campanha: sem header, rodapé, WhatsApp
 * flutuante, preloader, grain ou scroll suave do Lenis — nenhuma saída da
 * página que não seja a inscrição.
 *
 * O que É mantido e por quê:
 * - `AttributionTracker`: grava o cookie `semog-attrib`, de onde a server
 *   action lê o gclid NO SERVIDOR. Sem ele, campanha paga para o evento
 *   ficaria cega.
 * - `ConsentProvider`: o Consent Mode continua valendo numa página de
 *   campanha. O banner de rodapé saiu do site em 11/09/2026; a revogação vive
 *   na Política de Privacidade.
 * - `Analytics`/`Clarity`: só sobem em host mensurável (ver `measurableHost`).
 *
 * Os três ficam DENTRO do `ConsentProvider`, como em `(frontend)/layout.tsx`:
 * `Analytics` e `Clarity` chamam `useConsent()`, que lança fora do provider.
 */
export default function EventoLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${clash.variable} ${satoshi.variable}`} lang="pt-BR">
      <body>
        <ConsentProvider>
          <Analytics />
          <Clarity />
          <AttributionTracker />
          {children}
        </ConsentProvider>
      </body>
    </html>
  )
}
