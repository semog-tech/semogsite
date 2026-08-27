import { img } from '@/../content/media'
import { ImageMedia } from '@/components/Media/ImageMedia'

/**
 * Foto dentro do corpo de um post — irmã do `PostVideo`, mesmo mapa de
 * componentes do MDX (ver `blog/[slug]/page.tsx`). Criada em 27/08/2026 para
 * as fotos do Superlógica Next.
 *
 * Duas decisões de propósito:
 *
 * 1. **O `alt` não é prop.** Ele vem de `content/media.ts`, que é a fonte
 *    única — e `img()` lança em build se o arquivo não estiver catalogado.
 *    Aceitar `alt` por prop reabriria a porta que o catálogo fecha: uma foto
 *    entrando no artigo sem descrição, ou com uma descrição que só existe
 *    naquele MDX e some quando a mesma foto for reaproveitada.
 * 2. **`ImageMedia` em vez de `<img>` cru.** É o wrapper de `next/image` que o
 *    resto do site usa; entrega `srcset`, lazy e a moldura reservada a partir
 *    da dimensão intrínseca que `img()` devolve — sem ela, o texto abaixo
 *    pularia quando a foto carregasse.
 *
 * A largura acompanha o corpo do artigo (`.article-body` tem
 * `max-width: 720px`), daí o `sizes` fixado nesse teto: acima disso a imagem
 * nunca é servida maior do que aparece.
 */
export function PostImage({
  file,
  caption,
}: {
  /** Nome do arquivo no bucket (precisa de `alt` em `content/media.ts`). */
  file: string
  caption?: string
}) {
  return (
    <figure className="my-10">
      <ImageMedia
        resource={img(file)}
        className="h-auto w-full rounded-card border border-line"
        sizes="(min-width: 720px) 720px, 100vw"
      />
      {caption && (
        <figcaption className="mt-3 text-center text-[0.85rem] text-fg-3">{caption}</figcaption>
      )}
    </figure>
  )
}
