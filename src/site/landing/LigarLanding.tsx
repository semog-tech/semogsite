'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { ligarLanding } from './ligar-landing'

/** Liga o JS do pacote landing; falha de parte vai ao Sentry e a página segue em HTML. */
export function LigarLanding() {
  useEffect(
    () =>
      ligarLanding((erro, origem) => {
        console.error(`[site v2] ${origem} não ligou.`, erro)
        Sentry.captureException(erro, { tags: { origem } })
      }),
    [],
  )
  return null
}
