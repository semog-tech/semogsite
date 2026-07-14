import type { Block } from 'payload'

/**
 * Fiel à `.manifesto` de `_reference/index.html:551-555`: um parágrafo grande
 * revelado palavra a palavra no scroll (`data-words`). `eyebrow` é opcional
 * (o ref não usa na home); `text` é o parágrafo.
 */
export const wordsSectionBlock: Block = {
  slug: 'wordsSection',
  interfaceName: 'WordsSectionBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'text', type: 'textarea', required: true },
  ],
}
