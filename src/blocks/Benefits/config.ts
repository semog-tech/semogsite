import type { Block } from 'payload'

/**
 * Grade de vantagens fiel ao "Clube de benefícios" (`.club-grid`,
 * `_reference/solucoes.html:693-724`): parceria negociada pela escala da
 * Semog (internet, fornecedores, seguros, convênios locais). Sem ícone
 * dedicado — o ref usa SVGs inline por item, mas aqui os cards ficam só
 * com título/descrição, como o `RegistrosBlock`/`TestimonialsBlock`.
 */
export const benefitsBlock: Block = {
  slug: 'benefits',
  interfaceName: 'BenefitsBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text' },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
      ],
    },
  ],
}
