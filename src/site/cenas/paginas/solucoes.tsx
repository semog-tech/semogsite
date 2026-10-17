'use client'

import type { ListaCenas } from '@/site/core/tipos'
import { RunnerDeCenas } from '@/site/runner/RunnerDeCenas'
import { cenaProposta } from '../proposta'
import { cenaAberturaDeSolucoes } from '../solucoes/abertura'
import { cenaGaranteDeSolucoes } from '../solucoes/garante'
import {
  cenaAplicativoDeSolucoes,
  cenaBlocoDeSolucao,
  cenaPerguntasDeSolucoes,
  cenaPorqueDeSolucoes,
  cenaTiposDeSolucoes,
} from '../solucoes/secoes'

/**
 * /solucoes não tem protótipo (DP11): as cenas são de entrada, sem pin, na linguagem das páginas
 * portadas (máscara, peso, cortina, o traço céu do Garante).
 */
export const CENAS_SOLUCOES: ListaCenas = [
  ['solucoes', cenaAberturaDeSolucoes],
  ['tipos-de-condominio', cenaTiposDeSolucoes],
  ['porque-semog', cenaPorqueDeSolucoes],
  ['prestacao', cenaBlocoDeSolucao],
  ['garante', cenaGaranteDeSolucoes],
  ['aplicativo', cenaAplicativoDeSolucoes],
  ['software-de-dono', cenaBlocoDeSolucao],
  ['perguntas-solucoes', cenaPerguntasDeSolucoes],
  ['proposta', cenaProposta],
]

/** O runner das Soluções: a lista nasce aqui, do lado do cliente, e a página só passa o elemento. */
export function CenasDasSolucoes() {
  return <RunnerDeCenas pagina="solucoes" cenas={CENAS_SOLUCOES} />
}
