import type { getPayload } from 'payload'

/**
 * Inventário completo dos assets de `_reference/assets/` (22 imagens +
 * `semog-logo-light.svg` + 2 vídeos = 24 arquivos) que o seed `src/seed/media.ts`
 * sobe para a coleção `media` (Payload Local API → Supabase Storage via
 * `@payloadcms/storage-s3`, ver `src/payload.config.ts`).
 *
 * `path` é relativo à raiz do repo. `alt` é o texto real usado em
 * `_reference/*.html` onde o asset aparece (preferindo a primeira ocorrência
 * com `alt` não-vazio); quando o asset só aparece como `background-image`
 * CSS, poster de `<video>` (`aria-hidden="true"`, sem alt utilizável) ou não
 * é referenciado por nenhum `<img>` no snapshot do `_reference`, o `alt` é
 * uma descrição PT-BR sensata baseada no conteúdo real do arquivo (ver
 * `_reference/guia.html`, seção "De onde vieram as imagens e o vídeo").
 */
export const MEDIA_ASSETS: { filename: string; path: string; alt: string }[] = [
  // ---- Imagens (_reference/assets/img/) ----
  {
    filename: 'hero-towers.webp',
    path: '_reference/assets/img/hero-towers.webp',
    alt: 'Torres residenciais iluminadas à noite, com neblina, vista do hero da Semog',
  },
  {
    filename: 'residencial.webp',
    path: '_reference/assets/img/residencial.webp',
    alt: 'Condomínio residencial com piscina ao entardecer',
  },
  {
    filename: 'comercial.webp',
    path: '_reference/assets/img/comercial.webp',
    alt: 'Lobby de edifício comercial à noite',
  },
  {
    filename: 'associacoes.webp',
    path: '_reference/assets/img/associacoes.webp',
    alt: 'Reunião de associação de moradores ao entardecer',
  },
  {
    filename: 'incorporadoras.webp',
    path: '_reference/assets/img/incorporadoras.webp',
    alt: 'Obra de torre residencial ao amanhecer',
  },
  {
    filename: 'garante.webp',
    path: '_reference/assets/img/garante.webp',
    alt: 'Escudo de vidro protegendo torres residenciais em miniatura, símbolo do Semog Garante',
  },
  {
    filename: 'prestacao-contas.webp',
    path: '_reference/assets/img/prestacao-contas.webp',
    alt: 'Prestação de contas digital da Semog em um notebook: gráficos, documentos e assinatura digital',
  },
  {
    filename: 'app-phone.webp',
    path: '_reference/assets/img/app-phone.webp',
    alt: 'Aplicativo Semog em um smartphone',
  },
  {
    filename: 'equipe.webp',
    path: '_reference/assets/img/equipe.webp',
    alt: 'Equipe Semog atendendo clientes em escritório ao anoitecer',
  },
  {
    filename: 'blog-lazer.webp',
    path: '_reference/assets/img/blog-lazer.webp',
    alt: 'Academia de condomínio com vista para a cidade',
  },
  {
    filename: 'blog-financas.webp',
    path: '_reference/assets/img/blog-financas.webp',
    alt: 'Mesa de planejamento orçamentário com gráficos e calculadora',
  },
  {
    filename: 'recife.webp',
    path: '_reference/assets/img/recife.webp',
    alt: 'Marco Zero do Recife ao anoitecer',
  },
  {
    filename: 'joao-pessoa.webp',
    path: '_reference/assets/img/joao-pessoa.webp',
    alt: 'Farol do Cabo Branco em João Pessoa',
  },
  {
    filename: 'campina-grande.webp',
    path: '_reference/assets/img/campina-grande.webp',
    alt: 'Açude Velho em Campina Grande',
  },
  {
    filename: 'belem.webp',
    path: '_reference/assets/img/belem.webp',
    alt: 'Mercado Ver-o-Peso em Belém',
  },
  {
    filename: 'semog-logo-light.svg',
    path: '_reference/assets/img/semog-logo-light.svg',
    alt: 'Semog',
  },
  {
    filename: 'semog-one.webp',
    path: '_reference/assets/img/semog-one.webp',
    alt: 'Monitor exibindo o ERP Semog One em português',
  },
  {
    filename: 'c-prestacao.webp',
    path: '_reference/assets/img/c-prestacao.webp',
    alt: 'Documentos de vidro flutuando em um feixe de luz azul',
  },
  {
    filename: 'c-garante.webp',
    path: '_reference/assets/img/c-garante.webp',
    alt: 'Moedas e barras de vidro sobre superfície azul refletiva',
  },
  {
    filename: 'c-app.webp',
    path: '_reference/assets/img/c-app.webp',
    alt: 'Detalhe macro de um smartphone com reflexos azuis',
  },
  {
    filename: 'c-one.webp',
    path: '_reference/assets/img/c-one.webp',
    alt: 'Cubo de camadas de vidro brilhando em azul',
  },
  {
    filename: 'c-chave.webp',
    path: '_reference/assets/img/c-chave.webp',
    alt: 'Chave de vidro flutuando em luz azul, símbolo da administração completa de condomínios',
  },
  // ---- Vídeos (_reference/assets/video/) ----
  {
    filename: 'hero.mp4',
    path: '_reference/assets/video/hero.mp4',
    alt: 'Vídeo do hero: dolly lento sobre três torres residenciais à noite, com neblina e janelas acendendo',
  },
  {
    filename: 'garante.mp4',
    path: '_reference/assets/video/garante.mp4',
    alt: 'Vídeo do Semog Garante: escudo de vidro protegendo uma maquete de três torres residenciais',
  },
]

/**
 * Resolve o `id` numérico de um doc `media` pelo `filename` (o mesmo usado em
 * `MEDIA_ASSETS`). Usado pelos seeds de página (ondas seguintes) para
 * referenciar uploads já existentes sem duplicar upload. Lança se o asset
 * não tiver sido semeado ainda (rodar `pnpm seed:media` primeiro).
 */
export async function getMediaId(
  payload: Awaited<ReturnType<typeof getPayload>>,
  filename: string,
): Promise<number> {
  const res = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    pagination: false,
    depth: 0,
  })

  const doc = res.docs[0]
  if (!doc) {
    throw new Error(`media não encontrada: ${filename} (rodou pnpm seed:media?)`)
  }
  return doc.id
}
