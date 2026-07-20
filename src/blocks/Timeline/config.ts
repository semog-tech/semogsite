import type { Block } from 'payload'

/**
 * Fiel a `#historia` de `_reference/semog.html:275-328`: cabeçalho
 * (eyebrow/título/texto, `.sec-head`) + trilha de 8 cartões datados
 * (`.tl-item`: `date`/`title`/`text`), pinada e deslizada na horizontal por
 * `TimelinePinned`. `now` marca o cartão atual (glow, `.tl-item.now` — o
 * "Hoje" do ref). `image` é opcional: o ref não usa foto nos cartões, mas o
 * campo existe para reuso do bloco sem forçar conteúdo hardcoded.
 */
export const timelineBlock: Block = {
  slug: 'timeline',
  interfaceName: 'TimelineBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text' },
    { name: 'text', type: 'textarea' },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'date', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea', required: true },
        { name: 'image', type: 'upload', relationTo: 'media' },
        {
          name: 'now',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Marca o cartão atual (glow), equivalente a .tl-item.now no ref.' },
        },
      ],
    },
  ],
}
