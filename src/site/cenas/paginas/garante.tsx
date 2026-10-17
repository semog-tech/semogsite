'use client'

import type { ListaCenas } from '@/site/core/tipos'
import { RunnerDeCenas } from '@/site/runner/RunnerDeCenas'
import { cenaAberturaDoGarante } from '../garante/abertura'
import { cenaCaixa } from '../garante/caixa'
import { cenaDuvidas } from '../garante/duvidas'
import { cenaPapeis } from '../garante/papeis'
import { cenaProposta } from '../proposta'

/** Cenas do Semog Garante, na ordem das seções (paginas/garante.js do protótipo). */
export const CENAS_GARANTE: ListaCenas = [
  ['semog-garante', cenaAberturaDoGarante],
  ['caixa-do-condominio', cenaCaixa],
  ['papeis', cenaPapeis],
  ['duvidas-garante', cenaDuvidas],
  ['proposta', cenaProposta],
]

/** O runner do Garante: a lista nasce aqui, do lado do cliente, e a página só passa o elemento. */
export function CenasDoGarante() {
  return <RunnerDeCenas pagina="garante" cenas={CENAS_GARANTE} />
}
