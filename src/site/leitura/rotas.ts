import { PREFIXO_DA_PREVIA } from '@/site/rotas'

/** Prefixo das páginas de leitura: o mesmo da prévia (fase 4, DP3). */
export const PREFIXO_DA_LEITURA: string = PREFIXO_DA_PREVIA

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
