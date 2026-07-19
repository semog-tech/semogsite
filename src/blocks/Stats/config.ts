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
      name: 'variant',
      type: 'select',
      options: [
        { label: 'Grade (padrão — mini-stats)', value: 'grid' },
        { label: 'Destaque (1º número gigante + apoio)', value: 'feature' },
      ],
      defaultValue: 'grid',
      admin: {
        description:
          "`grid` = a grade de mini-stats fiel ao ref (usada em /semog e nas landings de cidade). `feature` = o 1º item vira um número gigante em destaque e os demais entram num grid de apoio 2×2 ao lado — mais impacto, usado na home. Vazio = 'grid' (comportamento anterior).",
      },
    },
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
