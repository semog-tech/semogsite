// Sentry — ponto de entrada de instrumentação do servidor (convenção Next.js:
// `register()` roda uma vez por instância de servidor, antes de aceitar
// requests). Carrega o config específico do runtime (`nodejs` vs `edge`) e
// exporta `onRequestError`, que o Next chama automaticamente para reportar
// erros de server components/route handlers/server actions ao Sentry.
//
// DSN deferido (Plano 4c): os configs importados abaixo inicializam o SDK com
// `enabled: false` quando `NEXT_PUBLIC_SENTRY_DSN` não está setado — nesse
// caso `onRequestError` também vira um no-op (nada é enviado).
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
