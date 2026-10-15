import type React from 'react'
import { Analytics } from '@/components/analytics/Analytics'
import { AttributionTracker } from '@/components/analytics/AttributionTracker'
import { Clarity } from '@/components/analytics/Clarity'
import { ConsentProvider } from '@/providers/ConsentProvider'
import { barlow, saira } from '@/site/fontes'
import '@/site/estilos/tokens.css'
import '@/site/estilos/base.css'

/**
 * Layout raiz do site v2, irmão de `(frontend)` (spec 3.1). Navegar entre root layouts faz
 * carga completa, então o theme.css antigo e os estilos novos nunca coexistem.
 *
 * Antes de pintar, `sem-js` vira `js` (esconde só os elementos `.entrada` até o movimento estar
 * pronto); se o JS não chegar, a rede de segurança marca `motion` em 6 s. O React encontra a
 * classe já trocada: daí o `suppressHydrationWarning`.
 *
 * Consentimento e medição como no `(evento)`: Analytics e Clarity só sobem em host mensurável
 * (`measurableHost`), então Preview e local não medem.
 */
const TROCA_SEM_JS = `(function(){var d=document.documentElement;d.classList.remove('sem-js');d.classList.add('js');setTimeout(function(){d.classList.add('motion')},6000)})()`

export default function LayoutSite({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`sem-js ${saira.variable} ${barlow.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: script fixo nosso, sem entrada de usuário; precisa rodar antes da primeira pintura */}
        <script dangerouslySetInnerHTML={{ __html: TROCA_SEM_JS }} />
      </head>
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
