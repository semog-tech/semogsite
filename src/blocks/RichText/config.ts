import type { Block } from 'payload'

/**
 * Bloco de conteúdo livre em rich text (lexical). Sem campos extras — o
 * editor cuida de heading/lista/link/etc. via as features padrão do
 * `lexicalEditor()` configurado em payload.config.ts.
 */
export const richTextBlock: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  fields: [{ name: 'content', type: 'richText' }],
}
