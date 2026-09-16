import type { Metadata } from 'next'
import type React from 'react'
import { clash, satoshi } from '../../fonts'
import '../../styles/theme.css'

/**
 * Root layout do route group `(interno)` — irmão de `(frontend)` e `(evento)`,
 * não filho. Como `(frontend)/layout.tsx` já declara `<html>`/`<body>`, ele é
 * um root layout; um grupo irmão precisa declarar os seus próprios.
 *
 * O que fica de fora, e por quê: header, rodapé, WhatsApp flutuante, preloader,
 * grain e Lenis são navegação de site institucional — aqui a pessoa chegou por
 * um link de e-mail para responder uma pergunta e ir embora, e qualquer saída
 * da página é só chance de errar. Analytics, Clarity e o rastreador de
 * atribuição também não entram: isto não é visita de visitante, é a própria
 * equipe; contá-la no GA4 sujaria justamente a medição que esta funcionalidade
 * existe para melhorar.
 *
 * `robots: noindex` fica no layout, não só na página. O site está com
 * `SITE_ALLOW_INDEX=true` em produção e **não há noindex global** — o
 * `X-Robots-Tag` do `next.config.ts` some exatamente quando a indexação é
 * liberada. Declarar aqui cobre esta rota e qualquer outra que venha a nascer
 * dentro do grupo.
 */
export const metadata: Metadata = {
  title: 'Semog — uso interno',
  robots: { index: false, follow: false },
}

export default function InternoLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${clash.variable} ${satoshi.variable}`} lang="pt-BR">
      <body className="bg-bg-deep font-body text-fg">{children}</body>
    </html>
  )
}
