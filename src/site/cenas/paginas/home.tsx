'use client'

import type { ListaCenas } from '@/site/core/tipos'
import { RunnerDeCenas } from '@/site/runner/RunnerDeCenas'
import { cenaRanking } from '../home/ranking'

/** Cenas da home, na ordem das seções (paginas/home.js do protótipo). A 4.5 e a 4.6 completam a lista. */
export const CENAS_HOME: ListaCenas = [['ranking', cenaRanking]]

/** O runner da home: a lista nasce aqui, do lado do cliente, e a página só passa o elemento. */
export function CenasDaHome() {
  return <RunnerDeCenas pagina="home" cenas={CENAS_HOME} />
}
