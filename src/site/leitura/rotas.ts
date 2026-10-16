import { VIRADA_1_FEITA } from '@/site/inventario'

/**
 * Prefixo das páginas de leitura enquanto elas vivem na prévia (fase 3). Vira '' na virada 1
 * (fase 5), no mesmo commit que leva as rotas a /blog, /privacidade e /termos.
 */
export const PREFIXO_DA_LEITURA: string = VIRADA_1_FEITA ? '' : '/previa-v2'

export type CaminhoDeLeitura = '/blog' | `/blog/${string}` | '/privacidade' | '/termos'

/** Link interno da leitura: na prévia, para a prévia; depois da virada, a URL real. */
export function caminhoDeLeitura(caminho: CaminhoDeLeitura): string {
  return `${PREFIXO_DA_LEITURA}${caminho}`
}

/** A URL real de um link da leitura (para conferir contra o inventário). */
export function semPrefixoDaLeitura(href: string): string {
  if (PREFIXO_DA_LEITURA === '' || !href.startsWith(`${PREFIXO_DA_LEITURA}/`)) return href
  return href.slice(PREFIXO_DA_LEITURA.length)
}
