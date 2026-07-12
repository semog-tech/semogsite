import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import { Container } from '@/components/ui/Container'
import type { RichTextBlock as RichTextBlockType } from '@/payload-types'

/**
 * Renderiza o lexical do campo `content` via `RichText` de
 * `@payloadcms/richtext-lexical/react`, dentro do `Container` do Plano 2 —
 * sem estilos próprios além do container.
 */
export function RichTextBlock({ content }: RichTextBlockType) {
  if (!content) return null
  return (
    <Container>
      <LexicalRichText data={content} />
    </Container>
  )
}
