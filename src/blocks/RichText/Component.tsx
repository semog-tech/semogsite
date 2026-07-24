import { MDXRemote } from 'next-mdx-remote/rsc'
import { Container } from '@/components/ui/Container'
import type { RichTextBlock as RichTextBlockType } from '@/types/blocks'

/**
 * Renderiza o `body` em MDX via `next-mdx-remote/rsc` (server component,
 * compila no próprio render — sem passo de serialização à parte). Sem
 * `legal`: dentro do `Container` do Plano 2 — sem estilos próprios além do
 * container (comportamento anterior, inalterado). Com `legal`: fiel a
 * `.legal-body` do ref (ver doc em `config.ts`/CSS em `theme.css`) —
 * `<section class="legal-body">` + `Container` + `div.wrap` (medida de
 * 760px), reproduzindo `_reference/privacidade.html:72-99`/
 * `termos.html:72-96`. `MDXRemote` não envolve a saída em nenhum elemento
 * próprio (compila pra JSX direto), então `.article-body`/`.legal-body`
 * seguem os mesmos seletores de tag (`p`/`h2`/`ul`/`a`/`blockquote`...) que
 * o CSS portado de `_reference` já usava com o lexical do Payload.
 */
export function RichTextBlock({ body, legal }: RichTextBlockType) {
  if (!body) return null
  if (legal) {
    return (
      <section className="legal-body">
        <Container>
          <div className="wrap">
            <MDXRemote source={body} />
          </div>
        </Container>
      </section>
    )
  }
  return (
    <Container>
      <MDXRemote source={body} />
    </Container>
  )
}
