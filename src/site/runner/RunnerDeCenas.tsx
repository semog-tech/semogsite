'use client'

import { useGSAP } from '@gsap/react'
import * as Sentry from '@sentry/nextjs'
import { CENAS_POR_PAGINA, type IdPaginaComCenas } from '@/site/cenas/registro'
import { montarPagina } from '@/site/core/montagem'

/**
 * Monta as cenas da página com o useGSAP (spec 3.1): o callback roda num gsap.context; os
 * contexts de cada seção, criados dentro dele, são revertidos no desmonte, e a função que
 * `montarPagina` devolve desliga Lenis, ticker e listeners. Renderiza nada: o HTML das seções
 * vem dos Server Components. Falha de cena vai ao Sentry e a seção fica estática.
 */
export function RunnerDeCenas({ pagina }: { pagina: IdPaginaComCenas }) {
  useGSAP(
    () =>
      montarPagina(CENAS_POR_PAGINA[pagina], {
        reportar: (erro, origem) => {
          console.error(`[site v2] ${origem}`, erro)
          Sentry.captureException(erro, { tags: { pagina, origem } })
        },
      }),
    { dependencies: [pagina], revertOnUpdate: true },
  )
  return null
}
