'use client'

import type { ListaCenas } from '@/site/core/tipos'
import { RunnerDeCenas } from '@/site/runner/RunnerDeCenas'
import { cenaProposta } from '../proposta'
import { cenaAssembleia } from '../semog/assembleia'
import { cenaDepoimentos } from '../semog/depoimentos'
import { cenaHistoria } from '../semog/historia'
import { cenaManifesto } from '../semog/manifesto'
import { cenaPessoas } from '../semog/pessoas'
import { cenaPrincipios } from '../semog/principios'

/** Cenas de A Semog, na ordem das seções (paginas/semog.js do protótipo). */
export const CENAS_SEMOG: ListaCenas = [
  ['a-semog', cenaManifesto],
  ['historia', cenaHistoria],
  ['principios', cenaPrincipios],
  ['pessoas', cenaPessoas],
  ['depoimentos', cenaDepoimentos],
  ['assembleia', cenaAssembleia],
  ['proposta', cenaProposta],
]

/** O runner de A Semog: a lista nasce aqui, do lado do cliente, e a página só passa o elemento. */
export function CenasDaSemog() {
  return <RunnerDeCenas pagina="semog" cenas={CENAS_SEMOG} />
}
