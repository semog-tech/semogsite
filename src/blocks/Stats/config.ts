import type { Block } from 'payload'

/**
 * Fiel à `.stats-grid` de `_reference/index.html`: uma lista de números
 * animados (Counter) com sufixo opcional (ex.: "mil") e rótulo.
 */
export const statsBlock: Block = {
  slug: 'stats',
  interfaceName: 'StatsBlock',
  fields: [
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'value', type: 'number', required: true },
        { name: 'suffix', type: 'text' },
        { name: 'label', type: 'text', required: true },
      ],
    },
  ],
}
