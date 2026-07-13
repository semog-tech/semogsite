import type { Block } from 'payload'

/**
 * Bloco de destaque "Semog Garante" — fiel à banda conceitual `.g-band-home`
 * de `_reference/index.html` (aprofundada em `_reference/garante.html`):
 * a garantia de inadimplência zero, seus diferenciais ("Como funciona",
 * `.g-step`) e um CTA. `cta` é opcional (grupo sem subfields obrigatórios,
 * mesmo padrão do `globals/Header.ts:17-22`) para permitir o bloco só com
 * o texto de destaque, sem botão.
 */
export const garanteBlock: Block = {
  slug: 'garante',
  interfaceName: 'GaranteBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    {
      name: 'features',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
      ],
    },
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'href', type: 'text' },
      ],
    },
    { name: 'note', type: 'text' },
  ],
}
