import type { ListaCenas } from '@/site/core/tipos'

/**
 * Cenas de cada página, na ordem das seções (o PAGINAS do main.js do protótipo). A página
 * `previa` é a rota /previa-v2 da fundação; ganha a cena do ranking na Tarefa 1.8.
 * Fase 4: avaliar carregar por página com import() se o bundle passar do orçamento.
 */
export const CENAS_POR_PAGINA = {
  previa: [],
} satisfies Record<string, ListaCenas>

export type IdPaginaComCenas = keyof typeof CENAS_POR_PAGINA
