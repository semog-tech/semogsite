import type { Block } from 'payload'

/**
 * Fiel à `.stats-grid` de `_reference/index.html`: uma lista de números
 * animados (Counter) com sufixo opcional (ex.: "mil") e rótulo.
 */
export const statsBlock: Block = {
  slug: 'stats',
  interfaceName: 'StatsBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text' },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'value', type: 'number', required: true },
        { name: 'prefix', type: 'text' },
        { name: 'suffix', type: 'text' },
        { name: 'label', type: 'text', required: true },
      ],
    },
  ],
}
