import type { Block } from 'payload'

/**
 * Fiel à `.prods.sec-light.white` de `_reference/index.html:628-674`: grade
 * de 4 `.prod-card`, cada um com um tema claro/escuro próprio
 * (`on-white`/`on-navy`/`on-deep` — `_reference/index.html:267-289`) que
 * independe do fundo claro da seção. `tag` reproduz o rótulo em caixa-alta
 * acima do título (ex.: "Semog Garante · com G5 Partners").
 */
export const produtosGridBlock: Block = {
  slug: 'produtosGrid',
  interfaceName: 'ProdutosGridBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text', required: true },
    {
      name: 'cards',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        {
          name: 'theme',
          type: 'select',
          required: true,
          defaultValue: 'on-white',
          options: [
            { label: 'Sobre branco', value: 'on-white' },
            { label: 'Sobre navy', value: 'on-navy' },
            { label: 'Sobre azul profundo', value: 'on-deep' },
          ],
        },
        { name: 'tag', type: 'text' },
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea', required: true },
        { name: 'href', type: 'text' },
      ],
    },
  ],
}
