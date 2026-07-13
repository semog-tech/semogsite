// Sentry — inicialização do runtime browser. Convenção de arquivo do Next.js
// (`instrumentation-client.ts`, estável desde 15.3): roda depois do HTML
// carregar e antes da hidratação — substitui o padrão antigo de inicializar
// no root layout. Resolvido automaticamente por `src/instrumentation-client.ts`
// (Next procura primeiro em `src/`, depois na raiz do projeto).
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

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
