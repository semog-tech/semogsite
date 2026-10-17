'use client'

import type { ListaCenas } from '@/site/core/tipos'
import { RunnerDeCenas } from '@/site/runner/RunnerDeCenas'
import { cenaAbertura } from '../home/abertura'
import { cenaComunidade } from '../home/comunidade'
import { cenaCondominios } from '../home/condominios'
import { cenaPilares } from '../home/pilares'
import { cenaRanking } from '../home/ranking'
import { cenaTecnologia } from '../home/tecnologia'
import { cenaUnidades } from '../home/unidades'
import { cenaProposta } from '../proposta'

/** Cenas da home, na ordem das seções (paginas/home.js do protótipo). */
export const CENAS_HOME: ListaCenas = [
  ['abertura', cenaAbertura],
  ['condominios', cenaCondominios],
  ['pilares', cenaPilares],
  ['tecnologia', cenaTecnologia],
  ['ranking', cenaRanking],
  ['unidades', cenaUnidades],
  ['comunidade', cenaComunidade],
  ['proposta', cenaProposta],
]

/** O runner da home: a lista nasce aqui, do lado do cliente, e a página só passa o elemento. */
export function CenasDaHome() {
  return <RunnerDeCenas pagina="home" cenas={CENAS_HOME} />
}
