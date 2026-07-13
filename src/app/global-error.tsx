'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { clash, satoshi } from '@/fonts'
import '@/styles/theme.css'

/**
 * Fallback catastrófico: só ativa em produção (em dev o overlay de erro do
 * Next assume) e apenas quando o erro acontece acima de qualquer error.js de
 * segmento — ex.: um dos root layouts (`(frontend)/layout.tsx` ou
 * `(payload)/layout.tsx`) lança. Por isso substitui o root layout inteiro:
 * define <html>/<body> própria e NÃO reusa HeaderServer/FooterServer (que
 * dependem do Payload local API — se o erro raiz foi causado por isso,
 * chamá-los de novo aqui só repetiria a falha). Fica na raiz de `src/app`
 * (fora de `(frontend)`/`(payload)`) porque este projeto usa múltiplos root
 * layouts (sem `src/app/layout.tsx` único): global-error precisa ficar fora
 * de qualquer grupo para cobrir os dois — dentro de um grupo, só capturaria
 * erros daquele root layout específico. Diferente de um `not-found.tsx` na
 * raiz (que erra em build por não ter root layout pra herdar), global-error
 * funciona aqui porque ele mesmo fornece html/body, não depende de nenhum.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
    Sentry.captureException(error)
  }, [error])

  return (
    <html className={`${clash.variable} ${satoshi.variable}`} lang="pt-BR">
      <body className="bg-navy-900 text-fg">
        <main className="flex min-h-dvh flex-col items-center justify-center text-center">
          <Container>
            <p className="mb-[1rem] text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-ice-500">
              Erro inesperado
            </p>
            <h1 className="mx-auto mb-[1.2rem] max-w-xl text-[clamp(2rem,5vw,3.2rem)] tracking-[-0.03em]">
              Algo saiu do controle
            </h1>
            <p className="mx-auto mb-[2rem] max-w-[46ch] text-lead text-fg-2">
              Um erro grave impediu o carregamento do site. Tente novamente — se continuar,
              recarregue a página.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button onClick={reset} variant="primary" size="lg">
                Tentar de novo
              </Button>
              <Button href="/" variant="ghost" size="lg">
                Voltar para o início
              </Button>
            </div>
          </Container>
        </main>
      </body>
    </html>
  )
}
