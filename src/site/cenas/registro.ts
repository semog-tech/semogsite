import type { ListaCenas } from '@/site/core/tipos'
import { cenaRanking } from './home/ranking'

/**
 * Cenas de cada página, na ordem das seções (o PAGINAS do main.js do protótipo). A página
 * `previa` é a rota /previa-v2 da fundação: prova o core com a cena do ranking.
 * Fase 4: avaliar carregar por página com import() se o bundle passar do orçamento.
 */
export const CENAS_POR_PAGINA = {
  previa: [['ranking', cenaRanking]],
} as const satisfies Record<string, ListaCenas>

export type IdPaginaComCenas = keyof typeof CENAS_POR_PAGINA
