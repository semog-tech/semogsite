import type { Block } from 'payload'

/**
 * Grid de depoimentos fiel a `.depo-card`/`.depo-grid`, visto nas páginas de
 * cidade do ref (ex.: `_reference/administradora-de-condominios-recife.html`,
 * seção "DEPOIMENTOS (claro)"): citação em destaque + autor/papel. Sem
 * avatar/foto — apenas texto, como o ref.
 */
export const testimonialsBlock: Block = {
  slug: 'testimonials',
  interfaceName: 'TestimonialsBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text' },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'quote', type: 'textarea', required: true },
        { name: 'author', type: 'text', required: true },
        { name: 'role', type: 'text' },
      ],
    },
  ],
}
