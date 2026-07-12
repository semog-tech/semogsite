import type { Block } from 'payload'

/**
 * Grid de cards genérico (ícone/glifo opcional + título + descrição), fiel
 * ao padrão `.why-card` visto em `_reference/incorporadoras.html`.
 */
export const featureGridBlock: Block = {
  slug: 'featureGrid',
  interfaceName: 'FeatureGridBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text' },
    {
      name: 'features',
      type: 'array',
      fields: [
        { name: 'icon', type: 'text' },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
      ],
    },
  ],
}
