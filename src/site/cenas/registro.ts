import type { ListaCenas } from '@/site/core/tipos'

/** As páginas do pacote app. Cada uma tem a sua lista em src/site/cenas/paginas/<pagina>.tsx. */
export type IdPaginaApp =
  | 'home'
  | 'semog'
  | 'gestao'
  | 'garante'
  | 'incorporadoras'
  | 'tecnologia'
  | 'solucoes'

/**
 * As listas juntas, só para os testes (ordem das seções, SSR, paridade). As páginas não importam
 * daqui: cada uma usa o próprio módulo client (DP4 do plano da fase 4). Cada tarefa de página
 * acrescenta a sua entrada.
 */
export const CENAS_POR_PAGINA: Partial<Record<IdPaginaApp, ListaCenas>> = {}

export type IdPaginaComCenas = IdPaginaApp
