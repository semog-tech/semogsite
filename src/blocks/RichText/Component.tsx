import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import { Container } from '@/components/ui/Container'
import type { RichTextBlock as RichTextBlockType } from '@/payload-types'

/**
 * Renderiza o lexical do campo `content` via `RichText` de
 * `@payloadcms/richtext-lexical/react`. Sem `legal`: dentro do `Container` do
 * Plano 2 — sem estilos próprios além do container (comportamento anterior,
 * inalterado). Com `legal`: fiel a `.legal-body` do ref (ver doc em
 * `config.ts`/CSS em `theme.css`) — `<section class="legal-body">` +
 * `Container` + `div.wrap` (medida de 760px), reproduzindo
 * `_reference/privacidade.html:72-99`/`termos.html:72-96`.
 */
export function RichTextBlock({ content, legal }: RichTextBlockType) {
  if (!content) return null
  if (legal) {
    return (
      <section className="legal-body">
        <Container>
          <div className="wrap">
            <LexicalRichText data={content} />
          </div>
        </Container>
      </section>
    )
  }
  return (
    <Container>
      <LexicalRichText data={content} />
    </Container>
  )
}
