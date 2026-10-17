import { compileMDX } from 'next-mdx-remote/rsc'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { img } from '@/../content/media'
import { ImageMedia } from '@/components/Media/ImageMedia'
import { idDoTitulo } from './dados'

/** Texto puro de um nó React (o título do MDX chega como string, mas pode trazer ênfase). */
export function textoDoNo(no: ReactNode): string {
  if (typeof no === 'string' || typeof no === 'number') return String(no)
  if (Array.isArray(no)) return no.map(textoDoNo).join('')
  if (isValidElement<{ children?: ReactNode }>(no)) return textoDoNo(no.props.children)
  return ''
}

/** `##` com o id que o índice "Neste texto" usa (idDoTitulo do mesmo texto). */
function TituloDoTexto({ children }: { children?: ReactNode }) {
  return <h2 id={idDoTitulo(textoDoNo(children))}>{children}</h2>
}

function SubtituloDoTexto({ children }: { children?: ReactNode }) {
  return <h3 id={idDoTitulo(textoDoNo(children))}>{children}</h3>
}

/**
 * `<PostImage />` do MDX no visual do site v2 (artigo.css, `.artigo-figura`). O `alt` vem de
 * `content/media.ts`, a fonte única, e não de prop (mesma decisão do PostImage do blog atual).
 * As props são o contrato público dos `.mdx`: os nomes não mudam.
 */
export function FiguraDoPost({ file, caption }: { file: string; caption?: string }) {
  return (
    <figure className="artigo-figura">
      <ImageMedia resource={img(file)} sizes="(min-width: 761px) 640px, 100vw" />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}

type PropsVideo = {
  /** Nome do arquivo no bucket (precisa de `alt` em `content/media.ts`). */
  file: string
  poster: string
  caption?: string
  orientation?: 'vertical' | 'horizontal'
  /** Proporção real do arquivo (ex.: `'636 / 1080'`); tem precedência sobre `orientation`. */
  aspectRatio?: string
}

/**
 * `<PostVideo />` do MDX no visual do site v2. Mesmas decisões do PostVideo do blog atual:
 * `<video>` nativo do bucket (o `media-src` da CSP já libera), `preload="none"` com poster, e o
 * vertical estreito e centrado (`.artigo-figura--vertical`). As props são o contrato dos `.mdx`.
 */
export function VideoDoPost({
  file,
  poster,
  caption,
  orientation = 'vertical',
  aspectRatio,
}: PropsVideo) {
  const video = img(file)
  const capa = img(poster)
  const vertical = orientation === 'vertical'
  return (
    <figure className={vertical ? 'artigo-figura artigo-figura--vertical' : 'artigo-figura'}>
      {/* biome-ignore lint/a11y/useMediaCaption: montagem com trilha, sem narração; o aria-label dá o nome acessível */}
      <video
        aria-label={video.alt}
        controls
        playsInline
        poster={capa.url}
        preload="none"
        style={{ aspectRatio: aspectRatio ?? (vertical ? '9 / 16' : '16 / 9') }}
      >
        <source src={video.url} type="video/mp4" />
        Seu navegador não reproduz este vídeo.
      </video>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}

/** O mapa do MDX do site v2: os nomes `PostImage` e `PostVideo` são os que os `.mdx` usam. */
export const COMPONENTES_DO_MDX = {
  h2: TituloDoTexto,
  h3: SubtituloDoTexto,
  PostImage: FiguraDoPost,
  PostVideo: VideoDoPost,
}

/**
 * Compila o MDX no servidor. Sem `catch` de propósito: o conteúdo é estático e a página é gerada
 * no build, então um `.mdx` quebrado derruba o build, em vez de ir ao ar como página vazia.
 */
export async function corpoDoMdx(fonte: string): Promise<ReactElement> {
  const { content } = await compileMDX({ source: fonte, components: COMPONENTES_DO_MDX })
  return content
}
