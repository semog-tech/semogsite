'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { ligarLeitura } from './ligar-leitura'

/** O JS das páginas de leitura (ligar-leitura.ts). Falha de uma peça vai ao Sentry e ao console. */
export function LigarLeitura() {
  useEffect(
    () =>
      ligarLeitura((erro, origem) => {
        console.error(`[leitura] ${origem} não ligou.`, erro)
        Sentry.captureException(erro, { tags: { origem: `leitura:${origem}` } })
      }),
    [],
  )
  return null
}
