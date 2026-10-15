/**
 * Inventário das URLs públicas e do que cada uma vira no site v2 (spec, seção 6). Fonte do
 * sitemap e do OG a partir da fase 3; até lá, só os testes o leem. Toda URL que o site serve
 * hoje precisa estar aqui, como página, redirect, removida ou intocada.
 */
export type Pacote = 'app' | 'landing' | 'leitura'
export type Fase = 3 | 4 | 6 | 7

export type EntradaInventario =
  | { tipo: 'pagina'; pacote: Pacote; fase: Fase; nova?: true }
  | { tipo: 'redireciona'; destino: string; fase: Fase }
  | { tipo: 'removida'; fase: Fase }
  | { tipo: 'intocada' }
  | { tipo: 'previa' }

export const INVENTARIO: Readonly<Record<string, EntradaInventario>> = {
  '/': { tipo: 'pagina', pacote: 'app', fase: 4 },
  '/semog': { tipo: 'pagina', pacote: 'app', fase: 4 },
  '/administracao-de-condominios': { tipo: 'pagina', pacote: 'app', fase: 4 },
  '/garante': { tipo: 'pagina', pacote: 'app', fase: 4 },
  '/incorporadoras': { tipo: 'pagina', pacote: 'app', fase: 4 },
  '/tecnologia': { tipo: 'pagina', pacote: 'app', fase: 4, nova: true },
  // Mantida no v2 como página própria (decisão do Leandro, 15/10/2026); conteúdo pendente (spec 9).
  '/solucoes': { tipo: 'pagina', pacote: 'app', fase: 4 },
  '/prestacao-de-contas-condominio': { tipo: 'redireciona', destino: '/tecnologia', fase: 4 },
  '/software-de-gestao-condominial': { tipo: 'redireciona', destino: '/tecnologia', fase: 4 },
  '/blog': { tipo: 'pagina', pacote: 'leitura', fase: 3 },
  '/privacidade': { tipo: 'pagina', pacote: 'leitura', fase: 3 },
  '/termos': { tipo: 'pagina', pacote: 'leitura', fase: 3 },
  '/proposta': { tipo: 'pagina', pacote: 'landing', fase: 4 },
  '/contato': { tipo: 'pagina', pacote: 'landing', fase: 4 },
  '/administradora-de-condominios-recife': { tipo: 'pagina', pacote: 'landing', fase: 6 },
  '/administradora-de-condominios-joao-pessoa': { tipo: 'pagina', pacote: 'landing', fase: 6 },
  '/administradora-de-condominios-campina-grande': { tipo: 'pagina', pacote: 'landing', fase: 6 },
  '/administradora-de-condominios-belem': { tipo: 'pagina', pacote: 'landing', fase: 6 },
  '/styleguide': { tipo: 'removida', fase: 7 },
  '/previa-v2': { tipo: 'previa' },
}

/** Todo post do blog (`/blog/<slug>`) vira página de leitura na fase 3. */
const POST_DO_BLOG: EntradaInventario = { tipo: 'pagina', pacote: 'leitura', fase: 3 }

/** Rotas de outros grupos que o site v2 não toca (spec 6). Terminado em "/" é prefixo. */
const INTOCADAS = ['/experience', '/qr/', '/desfecho/', '/api/'] as const

export function entradaDe(caminho: string): EntradaInventario | undefined {
  if (Object.hasOwn(INVENTARIO, caminho)) return INVENTARIO[caminho]
  if (/^\/blog\/[a-z0-9-]+$/.test(caminho)) return POST_DO_BLOG
  const intocada = INTOCADAS.some((rota) =>
    rota.endsWith('/') ? caminho.startsWith(rota) : caminho === rota,
  )
  return intocada ? { tipo: 'intocada' } : undefined
}
