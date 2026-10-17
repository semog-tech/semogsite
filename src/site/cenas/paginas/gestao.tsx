'use client'

import type { ListaCenas } from '@/site/core/tipos'
import { RunnerDeCenas } from '@/site/runner/RunnerDeCenas'
import { cenaAberturaDaGestao } from '../gestao/abertura'
import { cenaAtende } from '../gestao/atende'
import { cenaMesa } from '../gestao/mesa'
import { cenaPerguntas } from '../gestao/perguntas'
import { cenaTroca } from '../gestao/troca'
import { cenaProposta } from '../proposta'

/** Cenas da Gestão, na ordem das seções (paginas/gestao.js do protótipo). */
export const CENAS_GESTAO: ListaCenas = [
  ['administracao-de-condominios', cenaAberturaDaGestao],
  ['mesa-do-sindico', cenaMesa],
  ['quem-atende', cenaAtende],
  ['troca-de-administradora', cenaTroca],
  ['perguntas-gestao', cenaPerguntas],
  ['proposta', cenaProposta],
]

/** O runner da Gestão: a lista nasce aqui, do lado do cliente, e a página só passa o elemento. */
export function CenasDaGestao() {
  return <RunnerDeCenas pagina="gestao" cenas={CENAS_GESTAO} />
}
