import { VIRADA_1_FEITA } from './inventario'

/**
 * Prefixo das páginas do site v2 enquanto elas vivem na prévia. Vira '' na virada 1 (fase 5), no
 * mesmo commit que leva as rotas às URLs reais (VIRADA_1_FEITA = true).
 */
export const PREFIXO_DA_PREVIA: string = VIRADA_1_FEITA ? '' : '/previa-v2'

/**
 * Páginas que já existem na prévia. Cada tarefa da fase 4 acrescenta a sua quando a rota nasce
 * (o teste site-v2-rotas exige a rota); o blog e os documentos vieram na fase 3. Depois da virada
 * a lista não importa: tudo vai à URL real.
 */
export const PAGINAS_NA_PREVIA: ReadonlySet<string> = new Set([
  '/',
  '/administracao-de-condominios',
  '/blog',
  '/garante',
  '/incorporadoras',
  '/privacidade',
  '/semog',
  '/tecnologia',
  '/termos',
])

function existeNaPrevia(caminho: string): boolean {
  if (PAGINAS_NA_PREVIA.has(caminho)) return true
  return caminho.startsWith('/blog/') && PAGINAS_NA_PREVIA.has('/blog')
}

/**
 * Link interno do site v2 (DP3 do plano da fase 4): antes da virada, a página que existe na prévia
 * abre na prévia (o verificador navega entre páginas novas); as outras abrem a URL real. Hash e
 * query ficam no lugar. Âncora da mesma página e URL externa passam direto.
 */
export function caminhoNoSite(href: string): string {
  if (PREFIXO_DA_PREVIA === '' || !href.startsWith('/')) return href
  const partes = /^([^?#]*)(.*)$/.exec(href)
  const caminho = partes?.[1] || '/'
  const resto = partes?.[2] ?? ''
  if (!existeNaPrevia(caminho)) return href
  return `${PREFIXO_DA_PREVIA}${caminho === '/' ? '' : caminho}${resto}`
}

/** A URL real de um link da prévia (para conferir contra o inventário). */
export function semPrefixoDaPrevia(href: string): string {
  if (PREFIXO_DA_PREVIA === '') return href
  if (href === PREFIXO_DA_PREVIA) return '/'
  const depois = href.slice(PREFIXO_DA_PREVIA.length)
  if (href.startsWith(PREFIXO_DA_PREVIA) && /^[#?]/.test(depois)) return `/${depois}`
  if (href.startsWith(`${PREFIXO_DA_PREVIA}/`)) return depois
  return href
}
