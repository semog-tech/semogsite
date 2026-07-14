import type { Block } from 'payload'

/**
 * Fiel à seção `.hero` de `_reference/index.html`: vídeo full-bleed
 * (opcional, com poster), headline com split-word, lead e CTAs. `poster` é
 * um upload próprio (não derivado do vídeo) para permitir hero só-imagem.
 * `tag` alimenta a coluna de vidro `.hero-tagbox` (`.hero-grid` de 2 colunas
 * em desktop) — reference `index.html:492-508`.
 */
export const heroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'headline', type: 'text', required: true },
    { name: 'subhead', type: 'textarea' },
    {
      name: 'tag',
      type: 'text',
      admin: {
        description:
          'Coluna de vidro à direita do hero (`.hero-tagbox`), ex.: "Condomínios. Métricas. Organização." Opcional — sem valor, o layout fica de 1 coluna como antes.',
      },
    },
    { name: 'video', type: 'upload', relationTo: 'media' },
    { name: 'poster', type: 'upload', relationTo: 'media' },
    {
      name: 'ctas',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
        {
          name: 'variant',
          type: 'select',
          options: ['primary', 'ghost', 'white', 'glass'],
          defaultValue: 'primary',
        },
      ],
    },
  ],
}
