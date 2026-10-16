'use client'

import { useGSAP } from '@gsap/react'
import * as Sentry from '@sentry/nextjs'
import { montarPagina } from '@/site/core/montagem'
import type { ListaCenas } from '@/site/core/tipos'

/**
 * Monta as cenas da página com o useGSAP (spec 3.1): o callback roda num gsap.context; os
 * contexts de cada seção, criados dentro dele, são revertidos no desmonte, e a função que
 * `montarPagina` devolve desliga Lenis, ticker e listeners. Renderiza nada. A lista vem do módulo
 * client da página (src/site/cenas/paginas), para o bundle levar só as cenas dela (DP4).
 */
export function RunnerDeCenas({ pagina, cenas }: { pagina: string; cenas: ListaCenas }) {
  useGSAP(
    () =>
      montarPagina(cenas, {
        reportar: (erro, origem) => {
          console.error(`[site v2] ${origem}`, erro)
          Sentry.captureException(erro, { tags: { pagina, origem } })
        },
      }),
    { dependencies: [pagina, cenas], revertOnUpdate: true },
  )
  return null
}
