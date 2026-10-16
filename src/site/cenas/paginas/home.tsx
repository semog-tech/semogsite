'use client'

import type { ListaCenas } from '@/site/core/tipos'
import { RunnerDeCenas } from '@/site/runner/RunnerDeCenas'
import { cenaAbertura } from '../home/abertura'
import { cenaCondominios } from '../home/condominios'
import { cenaPilares } from '../home/pilares'
import { cenaRanking } from '../home/ranking'
import { cenaUnidades } from '../home/unidades'
import { cenaProposta } from '../proposta'

/** Cenas da home, na ordem das seções (paginas/home.js do protótipo). A 4.6 acrescenta tecnologia e comunidade. */
export const CENAS_HOME: ListaCenas = [
  ['abertura', cenaAbertura],
  ['condominios', cenaCondominios],
  ['pilares', cenaPilares],
  ['ranking', cenaRanking],
  ['unidades', cenaUnidades],
  ['proposta', cenaProposta],
]

/** O runner da home: a lista nasce aqui, do lado do cliente, e a página só passa o elemento. */
export function CenasDaHome() {
  return <RunnerDeCenas pagina="home" cenas={CENAS_HOME} />
}
