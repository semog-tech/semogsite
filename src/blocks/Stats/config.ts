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
        { label: 'Ledger editorial (linhas + contexto)', value: 'feature' },
      ],
      defaultValue: 'grid',
      admin: {
        description:
          "`grid` = a grade de mini-stats fiel ao ref (usada em /semog e nas landings de cidade). `feature` = layout ledger editorial: cada item numa linha própria com número grande alinhado à direita, rótulo e uma frase de apoio (`detail`), separados por réguas finas — usado na home. Vazio = 'grid' (comportamento anterior).",
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
        {
          name: 'detail',
          type: 'text',
          admin: {
            description:
              'Frase curta de apoio, exibida abaixo do rótulo só no variant "Ledger editorial" (ex.: "Desde 1991, sempre no Nordeste."). Ignorada no variant "grid".',
          },
        },
      ],
    },
  ],
}
