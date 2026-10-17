'use client'

import type { ListaCenas } from '@/site/core/tipos'
import { RunnerDeCenas } from '@/site/runner/RunnerDeCenas'
import { cenaProposta } from '../proposta'
import { cenaAberturaDaTecnologia } from '../tecnologia/abertura'
import { cenaConferencia } from '../tecnologia/conferencia'
import { cenaEvolucao } from '../tecnologia/evolucao'
import { cenaMes } from '../tecnologia/mes'

/** Cenas da Tecnologia, na ordem das seções (paginas/tecnologia.js do protótipo). */
export const CENAS_TECNOLOGIA: ListaCenas = [
  ['semog-one', cenaAberturaDaTecnologia],
  ['mes', cenaMes],
  ['evolucao', cenaEvolucao],
  ['conferencia', cenaConferencia],
  ['proposta', cenaProposta],
]

/** O runner da Tecnologia: a lista nasce aqui, do lado do cliente, e a página só passa o elemento. */
export function CenasDaTecnologia() {
  return <RunnerDeCenas pagina="tecnologia" cenas={CENAS_TECNOLOGIA} />
}
