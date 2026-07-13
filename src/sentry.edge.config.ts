// Sentry — inicialização do runtime Edge (middleware, route handlers marcados
// `export const runtime = 'edge'`). Importado condicionalmente por
// `instrumentation.ts` quando `NEXT_RUNTIME === 'edge'`.
//
// DSN deferido (Plano 4c): sem `NEXT_PUBLIC_SENTRY_DSN`, `enabled` fica `false`
// e o SDK vira um no-op completo — não erro, não crash, não envia nada. Ver
// `.env.example` para a variável.
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: 0.1,
})
