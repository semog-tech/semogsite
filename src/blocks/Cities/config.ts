import type { Block } from 'payload'

/**
 * Grid de cidades de atuação, fiel à seção "Presença" (`.cities-acc`) de
 * `_reference/index.html`: cada painel de cidade traz papel (Matriz/Filial)
 * e UF. Sem foto por ora — os `assets/img/{recife,joao-pessoa,...}.webp` do
 * ref entram depois, com S3; os cards usam apenas texto como placeholder.
 */
export const citiesBlock: Block = {
  slug: 'cities',
  interfaceName: 'CitiesBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text' },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'city', type: 'text', required: true },
        { name: 'uf', type: 'text', required: true },
        { name: 'role', type: 'text' },
      ],
    },
  ],
}
