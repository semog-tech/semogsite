'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'

/**
 * Error boundary de segmento para (frontend): captura erros lançados por
 * `page.tsx`/blocks durante a renderização. Como todo error.js, aparece
 * dentro do root layout do grupo mais próximo — Header/Footer continuam
 * montados e interativos. `reset()` tenta re-renderizar o segmento sem
 * reload completo.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Section className="flex min-h-dvh flex-col items-center justify-center !py-0 text-center">
      <Container className="pt-[110px]">
        <p className="mb-[1rem] text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-ice-500">
          Algo deu errado
        </p>
        <h1 className="mx-auto mb-[1.4rem] max-w-2xl text-[clamp(2.2rem,5vw,3.6rem)] tracking-[-0.04em]">
          Não conseguimos carregar esta página
        </h1>
        <p className="mx-auto mb-[2.2rem] max-w-[46ch] text-lead text-fg-2">
          Ocorreu um erro inesperado. Tente novamente — se o problema persistir, volte mais tarde.
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
    </Section>
  )
}
