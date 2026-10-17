'use client'

import type { ListaCenas } from '@/site/core/tipos'
import { RunnerDeCenas } from '@/site/runner/RunnerDeCenas'
import { cenaProposta } from '../proposta'

/** /solucoes não tem cena própria (sem protótipo, DP11): só o pedido de proposta anima. */
export const CENAS_SOLUCOES: ListaCenas = [['proposta', cenaProposta]]

/** O runner das Soluções: a lista nasce aqui, do lado do cliente, e a página só passa o elemento. */
export function CenasDasSolucoes() {
  return <RunnerDeCenas pagina="solucoes" cenas={CENAS_SOLUCOES} />
}
