/**
 * As opções do Sentry no navegador, num módulo separado do `Sentry.init`.
 *
 * **Por que não ficam inline no `src/instrumentation-client.ts`:** para que os
 * testes possam passar *este mesmo objeto* ao `Sentry.init` deles. Enquanto as
 * opções eram um literal dentro do `init`, os testes montavam uma cópia — e
 * apagar o `beforeSend` da produção deixava a suíte inteira verde, porque a
 * cópia do teste continuava correta. O filtro seria perdido em silêncio.
 *
 * Importar o `instrumentation-client` direto do teste **não** resolveria: o
 * import roda o `Sentry.init` de produção (com `enabled: false`, sem DSN) e só
 * o primeiro `init` do processo vale — o do teste viraria um client mudo e
 * todo `toHaveLength(0)` passaria provando nada. Daí o módulo sem efeito
 * colateral. Que o `init` de produção realmente usa esta constante é o que
 * `tests/int/sentry-init-aplica-filtros.int.spec.ts` verifica.
 */
import type * as Sentry from '@sentry/nextjs'
import { descartaRuidoConhecido } from '@/lib/sentryFilters'

/**
 * DSN deferido (Plano 4c): sem `NEXT_PUBLIC_SENTRY_DSN`, `enabled` fica
 * `false` e o SDK vira um no-op completo — não erro, não crash, não envia
 * nada. Ver `.env.example` para a variável.
 *
 * O `satisfies` usa o parâmetro do próprio `init` em vez de um tipo nomeado: o
 * `@sentry/nextjs` não reexporta `BrowserOptions`, e amarrar na assinatura da
 * função é o que não envelhece entre versões.
 */
export const OPCOES_DO_SENTRY_NO_NAVEGADOR = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: 0.1,

  // Ruído de navegador de terceiro — webview do Instagram sendo destruído, e
  // um navegador headless de scraping. Os dois casos, e a razão de nenhum
  // deles ser um `denyUrls`, estão documentados em `sentryFilters`.
  beforeSend: descartaRuidoConhecido,
} satisfies Parameters<typeof Sentry.init>[0]
