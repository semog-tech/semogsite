import type { Block } from 'payload'

/**
 * Faixa de CTA com fundo em `--grad-band`, fiel ao padrão `.newsletter` /
 * `.g-band` visto em `_reference` (título + texto de apoio + um botão).
 */
export const ctaBandBlock: Block = {
  slug: 'ctaBand',
  interfaceName: 'CTABandBlock',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
  ],
}
