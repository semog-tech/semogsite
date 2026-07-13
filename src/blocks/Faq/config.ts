import type { Block } from 'payload'

/**
 * Accordion de perguntas frequentes fiel a `.faq details`/`.faq summary .plus`
 * de `_reference/solucoes.html` e `_reference/garante.html`.
 */
export const faqBlock: Block = {
  slug: 'faq',
  interfaceName: 'FaqBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text' },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
  ],
}
