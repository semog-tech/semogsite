import { img } from '@/../content/media'

/**
 * Vídeo dentro do corpo de um post — o único componente disponível no MDX
 * (ver o mapa `components` em `blog/[slug]/page.tsx`). Criado em 27/08/2026
 * para o reel do Superlógica Next.
 *
 * Herda as duas decisões já fechadas em `ExperienceVideo`, pelos mesmos
 * motivos, e elas não devem ser revisitadas post a post:
 *
 * 1. **`<video>` nativo servido do bucket, nunca embed do Instagram.** O embed
 *    exigiria abrir o CSP para um domínio de terceiro e entregaria a página a
 *    ele (scripts, cookies e um convite a sair do site no meio do artigo). O
 *    `media-src` do bucket já está liberado em `next.config.ts`, então o MP4
 *    toca sem tocar em header.
 * 2. **`preload="none"` com `poster`.** O vídeo fica no meio do artigo, abaixo
 *    da dobra: não pode competir com o carregamento do texto. O poster segura
 *    a moldura até alguém dar play.
 *
 * A diferença em relação ao `ExperienceVideo` é a largura: `.article-body` tem
 * `max-width: 720px`, e um vertical 9:16 ocupando essa largura teria ~1280px
 * de altura — empurraria o texto inteiro para fora da tela. Daí o
 * `max-width` próprio por orientação, centralizado.
 *
 * `orientation` dá só os dois formatos canônicos (9:16 e 16:9). Nem todo
 * arquivo cai neles: o reel do Next 2026 é 636x1080, e forçar 9:16 nele
 * reservaria uma moldura mais alta que o vídeo — tarja preta em cima e
 * embaixo até o play. Por isso `aspectRatio` existe: quando informada, ela
 * manda, e o valor deve ser a proporção real do arquivo.
 */
export function PostVideo({
  file,
  poster,
  caption,
  orientation = 'vertical',
  aspectRatio,
}: {
  /** Nome do arquivo no bucket (precisa de `alt` em `content/media.ts`). */
  file: string
  /** Nome do arquivo do poster no bucket. */
  poster: string
  caption?: string
  /** `vertical` = reel 9:16 (default); `horizontal` = 16:9. */
  orientation?: 'vertical' | 'horizontal'
  /** Proporção real do arquivo (ex.: `'636 / 1080'`). Tem precedência sobre `orientation`. */
  aspectRatio?: string
}) {
  const video = img(file)
  const cover = img(poster)
  const vertical = orientation === 'vertical'
  const ratio = aspectRatio ?? (vertical ? '9 / 16' : '16 / 9')

  return (
    <figure className={`my-10 ${vertical ? 'mx-auto max-w-[360px]' : ''}`}>
      {/* biome-ignore lint/a11y/useMediaCaption: montagem com trilha, sem narração — não há fala a legendar; o `aria-label` dá o nome acessível ao player */}
      <video
        aria-label={video.alt}
        className="w-full rounded-card border border-line"
        controls
        playsInline
        poster={cover.url}
        preload="none"
        style={{ aspectRatio: ratio }}
      >
        <source src={video.url} type="video/mp4" />
        Seu navegador não reproduz este vídeo.
      </video>
      {caption && (
        <figcaption className="mt-3 text-center text-[0.85rem] text-fg-3">{caption}</figcaption>
      )}
    </figure>
  )
}
