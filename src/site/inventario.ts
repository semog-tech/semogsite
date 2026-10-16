/**
 * Inventário das URLs públicas e do que cada uma vira no site v2 (spec, seção 6). É a fonte do
 * sitemap (src/site/sitemap.ts) e do OG (src/site/seo/og.ts) desde a fase 3. Toda URL que o site
 * serve hoje precisa estar aqui, como página, redirect, removida, intocada, prévia ou técnica.
 */
export type Pacote = 'app' | 'landing' | 'leitura'
export type Fase = 3 | 4 | 6 | 7

export type EntradaInventario =
  | { tipo: 'pagina'; pacote: Pacote; fase: Fase; nova?: true }
  | { tipo: 'redireciona'; destino: string; fase: Fase }
  | { tipo: 'removida'; fase: Fase }
  | { tipo: 'intocada' }
  | { tipo: 'previa' }
  | { tipo: 'tecnica' }

/**
 * A virada 1 (fase 5) põe o site v2 no ar: as páginas da prévia passam às URLs reais,
 * /tecnologia nasce e as duas URLs da fase 4 começam a redirecionar. Vira `true` no mesmo commit
 * que move as rotas (e junto com `PREFIXO_DA_LEITURA`, src/site/leitura/rotas.ts). Até lá, o que
 * está no ar é o site atual.
 */
export const VIRADA_1_FEITA: boolean = false

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
  // Arquivos especiais do App Router em src/app. Não são páginas: ficam fora do sitemap.
  '/sitemap.xml': { tipo: 'tecnica' },
  '/robots.txt': { tipo: 'tecnica' },
  '/icon.svg': { tipo: 'tecnica' },
  '/apple-icon.png': { tipo: 'tecnica' },
  '/opengraph-image': { tipo: 'tecnica' },
}

/** Todo post do blog (`/blog/<slug>`) vira página de leitura na fase 3. */
const POST_DO_BLOG: EntradaInventario = { tipo: 'pagina', pacote: 'leitura', fase: 3 }

/** Rotas de outros grupos que o site v2 não toca (spec 6). Terminado em "/" é prefixo. */
const INTOCADAS = ['/experience', '/qr/', '/desfecho/', '/api/'] as const

/** OG por página (src/app/[slug]/opengraph-image.tsx) e por post (src/app/blog/[slug]/...). */
const OG_DINAMICO = /^\/(?:blog\/)?[a-z0-9-]+\/opengraph-image$/

export function entradaDe(caminho: string): EntradaInventario | undefined {
  if (Object.hasOwn(INVENTARIO, caminho)) return INVENTARIO[caminho]
  // As páginas de leitura (e as da fase 4) vivem sob /previa-v2/ até a virada 1.
  if (caminho.startsWith('/previa-v2/')) return { tipo: 'previa' }
  if (OG_DINAMICO.test(caminho)) return { tipo: 'tecnica' }
  if (/^\/blog\/[a-z0-9-]+$/.test(caminho)) return POST_DO_BLOG
  const intocada = INTOCADAS.some((rota) =>
    rota.endsWith('/') ? caminho.startsWith(rota) : caminho === rota,
  )
  return intocada ? { tipo: 'intocada' } : undefined
}

/**
 * A URL responde como página no build atual: é o que o sitemap lista. Página nova só existe
 * depois da virada; os redirects do inventário são todos da fase 4 e entram com a virada 1
 * (teste em site-v2-inventario), então até ela a URL ainda é página.
 */
export function servidaComoPagina(
  entrada: EntradaInventario | undefined,
  viradaFeita: boolean = VIRADA_1_FEITA,
): boolean {
  if (entrada?.tipo === 'pagina') return entrada.nova !== true || viradaFeita
  if (entrada?.tipo === 'redireciona') return !viradaFeita
  return false
}
