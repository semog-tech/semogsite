'use client'

import type { ListaCenas } from '@/site/core/tipos'
import { RunnerDeCenas } from '@/site/runner/RunnerDeCenas'
import { cenaAberturaDasIncorporadoras } from '../incorporadoras/abertura'
import { cenaConvivencia } from '../incorporadoras/convivencia'
import { cenaGanhos } from '../incorporadoras/ganhos'
import { cenaInstalacao } from '../incorporadoras/instalacao'
import { cenaLancamento } from '../incorporadoras/lancamento'
import { cenaPercurso } from '../incorporadoras/percurso'
import { cenaProposta } from '../proposta'

/** Cenas de Incorporadoras, na ordem das seções (paginas/incorporadoras.js do protótipo). */
export const CENAS_INCORPORADORAS: ListaCenas = [
  ['incorporadoras', cenaAberturaDasIncorporadoras],
  ['convivencia', cenaConvivencia],
  ['percurso', cenaPercurso],
  ['ganhos', cenaGanhos],
  ['instalacao', cenaInstalacao],
  ['lancamento', cenaLancamento],
  ['proposta', cenaProposta],
]

/** O runner de Incorporadoras: a lista nasce aqui, do lado do cliente, e a página só passa o elemento. */
export function CenasDasIncorporadoras() {
  return <RunnerDeCenas pagina="incorporadoras" cenas={CENAS_INCORPORADORAS} />
}
