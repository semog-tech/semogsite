/**
 * URLs públicas das imagens/vídeos no storage do Supabase (mantido) + o alt
 * real de cada arquivo. Substitui o `getMediaId` do seed
 * (`src/seed/lib/media.ts`), que resolvia o id numérico do doc `media` do
 * Payload em runtime — no modelo estático a imagem é só uma URL pública,
 * sem id nenhum pra resolver.
 *
 * A base é o bucket público já usado hoje (ver `next.config.ts`
 * `images.remotePatterns`, aponta pro mesmo host).
 *
 * `ALT_BY_FILENAME` é um port 1:1 de `MEDIA_ASSETS[].alt`
 * (`src/seed/lib/media.ts`) — cada valor foi conferido contra a fonte antes
 * de portar (ver `.superpowers/sdd/redesign/cms01-task-4-report.md`). O alt
 * é acessibilidade/SEO: não pode se perder, por isso `img()` lança se o
 * filename não estiver mapeado em vez de devolver alt vazio por omissão.
 */
const BASE = 'https://qvxlkovrxfqigeaopvui.supabase.co/storage/v1/object/public/media/'

const ALT_BY_FILENAME: Record<string, string> = {
  // ---- Imagens (_reference/assets/img/) ----
  'hero-towers.webp':
    'Torres residenciais iluminadas à noite, com neblina, vista do hero da Semog',
  'residencial.webp': 'Condomínio residencial com piscina ao entardecer',
  'comercial.webp': 'Lobby de edifício comercial à noite',
  'associacoes.webp': 'Reunião de associação de moradores ao entardecer',
  'incorporadoras.webp': 'Obra de torre residencial ao amanhecer',
  'garante.webp':
    'Escudo de vidro protegendo torres residenciais em miniatura, símbolo do Semog Garante',
  'prestacao-contas.webp':
    'Prestação de contas digital da Semog em um notebook: gráficos, documentos e assinatura digital',
  'app-phone.webp': 'Aplicativo Semog em um smartphone',
  'equipe.webp': 'Equipe Semog atendendo clientes em escritório ao anoitecer',
  'blog-lazer.webp': 'Academia de condomínio com vista para a cidade',
  'blog-financas.webp': 'Mesa de planejamento orçamentário com gráficos e calculadora',
  'recife.webp': 'Marco Zero do Recife ao anoitecer',
  'joao-pessoa.webp': 'Farol do Cabo Branco em João Pessoa',
  'campina-grande.webp': 'Açude Velho em Campina Grande',
  'belem.webp': 'Mercado Ver-o-Peso em Belém',
  'semog-logo-light.svg': 'Semog',
  'semog-one.webp': 'Monitor exibindo o ERP Semog One em português',
  'c-prestacao.webp': 'Documentos de vidro flutuando em um feixe de luz azul',
  'c-garante.webp': 'Moedas e barras de vidro sobre superfície azul refletiva',
  'c-app.webp': 'Detalhe macro de um smartphone com reflexos azuis',
  'c-one.webp': 'Cubo de camadas de vidro brilhando em azul',
  'c-chave.webp':
    'Chave de vidro flutuando em luz azul, símbolo da administração completa de condomínios',
  // ---- Vídeos (_reference/assets/video/) ----
  'hero.mp4':
    'Vídeo do hero: dolly lento sobre três torres residenciais à noite, com neblina e janelas acendendo',
  'garante.mp4':
    'Vídeo do Semog Garante: escudo de vidro protegendo uma maquete de três torres residenciais',
  // ---- Telas do aplicativo (public/app-screens/) ----
  'app-inicio.webp': 'Tela inicial do aplicativo Semog, com atalhos para Portaria e Área do condômino',
  'app-encomenda.webp': 'Detalhe de uma encomenda no aplicativo Semog, com QR code para retirada',
}

/**
 * Dimensões intrínsecas de cada imagem (`sharp` calcula no upload do Payload;
 * aqui é um port 1:1 — conferido via `GET /api/media` em produção, 24/07/2026).
 *
 * Sem isso, `img()` devolveria só `{url, alt}` e `ImageMedia`
 * (`src/components/Media/ImageMedia.tsx`) cairia no fallback genérico
 * `width ?? 1200`/`height ?? 800` pra TODA imagem não-`fill` do site — a
 * comparação de fidelidade (Task 5, Step 9) pegou exatamente isso: `<img>`
 * com `width`/`height` (logo `srcset` do `next/image`) diferentes dos de
 * produção em `/` (app-encomenda.webp) e `/solucoes` (residencial.webp).
 * Vídeos (`.mp4`) e o logo (`.svg`) não têm dimensão no Payload (`null`) e só
 * são usados via `fill`/`<video>` (não passam por este fallback) — por isso
 * ficam de fora deste mapa.
 */
const DIMENSIONS_BY_FILENAME: Record<string, { width: number; height: number }> = {
  'hero-towers.webp': { width: 2048, height: 1152 },
  'residencial.webp': { width: 2048, height: 1536 },
  'comercial.webp': { width: 2400, height: 1792 },
  'associacoes.webp': { width: 2400, height: 1792 },
  'incorporadoras.webp': { width: 2048, height: 1152 },
  'garante.webp': { width: 2048, height: 2048 },
  'prestacao-contas.webp': { width: 2688, height: 1520 },
  'app-phone.webp': { width: 1744, height: 2336 },
  'equipe.webp': { width: 2400, height: 1792 },
  'blog-lazer.webp': { width: 2048, height: 1152 },
  'blog-financas.webp': { width: 2752, height: 1536 },
  'recife.webp': { width: 1536, height: 2048 },
  'joao-pessoa.webp': { width: 1536, height: 2048 },
  'campina-grande.webp': { width: 1536, height: 2048 },
  'belem.webp': { width: 1536, height: 2048 },
  'semog-one.webp': { width: 2336, height: 1744 },
  'c-prestacao.webp': { width: 2400, height: 1792 },
  'c-garante.webp': { width: 2400, height: 1792 },
  'c-app.webp': { width: 2400, height: 1792 },
  'c-one.webp': { width: 2400, height: 1792 },
  'c-chave.webp': { width: 2752, height: 1536 },
  'app-inicio.webp': { width: 532, height: 1187 },
  'app-encomenda.webp': { width: 532, height: 1187 },
}

/** Monta `{url, alt, width?, height?}` (o shape que `Media` aceita) a partir do filename já semeado no bucket. */
export function img(file: string): { url: string; alt: string; width?: number; height?: number } {
  const alt = ALT_BY_FILENAME[file]
  if (alt === undefined) {
    throw new Error(`content/media: alt não mapeado para "${file}" — adicione em ALT_BY_FILENAME`)
  }
  const dims = DIMENSIONS_BY_FILENAME[file]
  return { url: BASE + file, alt, ...(dims ? { width: dims.width, height: dims.height } : {}) }
}
