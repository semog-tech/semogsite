// Sentry — inicialização do runtime browser. Convenção de arquivo do Next.js
// (`instrumentation-client.ts`, estável desde 15.3): roda depois do HTML
// carregar e antes da hidratação — substitui o padrão antigo de inicializar
// no root layout. Resolvido automaticamente por `src/instrumentation-client.ts`
// (Next procura primeiro em `src/`, depois na raiz do projeto).
//
// As opções moram em `@/lib/sentryOpcoesCliente` e são passadas **inteiras**,
// sem spread nem override: é a forma que permite aos testes exercitarem o
// mesmo objeto que a produção usa. Trocar esta linha por um literal aqui
// devolve o filtro de ruído ao estado em que podia sumir sem teste vermelho —
// `tests/int/sentry-init-aplica-filtros.int.spec.ts` existe para barrar isso.
import * as Sentry from '@sentry/nextjs'
import { OPCOES_DO_SENTRY_NO_NAVEGADOR } from '@/lib/sentryOpcoesCliente'

Sentry.init(OPCOES_DO_SENTRY_NO_NAVEGADOR)

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
