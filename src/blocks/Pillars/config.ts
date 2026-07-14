import type { Block } from 'payload'

/**
 * Fiel à `.pillars` de `_reference/index.html:558-573`: linhas `.pillar-row`
 * (título + texto em duas colunas) reveladas no scroll e interativas no hover
 * (padding/cor/glyph). `glyph` é opcional (número ou símbolo à esquerda do
 * título — o ref não usa na home; presente para reuso nas outras páginas).
 */
export const pillarsBlock: Block = {
  slug: 'pillars',
  interfaceName: 'PillarsBlock',
  fields: [
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'glyph', type: 'text' },
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea', required: true },
      ],
    },
  ],
}
