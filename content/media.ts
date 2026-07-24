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

/** Monta `{url, alt}` (o shape que `Media` aceita) a partir do filename já semeado no bucket. */
export function img(file: string): { url: string; alt: string } {
  const alt = ALT_BY_FILENAME[file]
  if (alt === undefined) {
    throw new Error(`content/media: alt não mapeado para "${file}" — adicione em ALT_BY_FILENAME`)
  }
  return { url: BASE + file, alt }
}
