import type { Block } from 'payload'

/**
 * Cartões de unidade fiel à seção "Unidades" (`.unit`,
 * `_reference/contato.html:270-338`): cidade + UF + endereço + telefone por
 * card, uma unidade por item. `whatsapp` é opcional e alimenta um botão
 * único de contato rápido (`https://wa.me/<whatsapp>`), como o
 * `.quick-card`/`.wa-float` do mesmo ref — aqui os dados não vêm do global
 * `Company` (que já tem `whatsapp`, ver `globals/Company.ts:21`), pois o
 * bloco precisa funcionar sozinho em qualquer página.
 */
export const contactInfoBlock: Block = {
  slug: 'contactInfo',
  interfaceName: 'ContactInfoBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text' },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'city', type: 'text', required: true },
        { name: 'uf', type: 'text', required: true },
        { name: 'address', type: 'textarea', required: true },
        { name: 'phone', type: 'text', required: true },
      ],
    },
    { name: 'whatsapp', type: 'text' },
  ],
}
