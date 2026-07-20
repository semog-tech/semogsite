import type { Block } from 'payload'

/**
 * Dois usos, escolhidos por `variant`:
 *
 * 1. `'grid'` (default) — números de prova social em cards numerados
 *    (`/proposta`, `.trust-stats` do `_reference/proposta.html`). Sem
 *    ícone dedicado, cards só com título/descrição, como o
 *    `RegistrosBlock`/`TestimonialsBlock`.
 * 2. `'bento'` — fiel a `.benefits.sec-light.white` > `.bento` de
 *    `_reference/solucoes.html:487-520`: 5 células de tamanhos
 *    diferentes (`.c1`..`.c5`), assumindo a ORDEM exata do ref (24h /
 *    acesso direto aos sócios / 35 anos / equipes locais com foto / 100%
 *    digital) — `value` é o número gigante (`.num`) das células 1/3/5,
 *    `image` é a foto de fundo só da célula 4 (`c4`, `blog-lazer.webp` no
 *    ref).
 */
export const benefitsBlock: Block = {
  slug: 'benefits',
  interfaceName: 'BenefitsBlock',
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'grid',
      options: [
        { label: 'Grade numerada (prova social)', value: 'grid' },
        { label: 'Bento 5 células', value: 'bento' },
      ],
    },
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text' },
    {
      name: 'titleAccent',
      type: 'text',
      admin: {
        description:
          'Trecho final de `title` a destacar em gradiente (.gx), ex.: "Semog assume." em "O que muda quando a Semog assume." Só no variant bento.',
      },
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
        {
          name: 'value',
          type: 'text',
          admin: {
            description: 'Número gigante da célula (.num), ex.: "24h". Só no variant bento.',
          },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Foto de fundo da célula (c4). Só no variant bento.' },
        },
      ],
    },
  ],
}
