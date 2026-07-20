import type { Block } from 'payload'

/**
 * Grid de cidades de atuação, fiel à seção "Presença" (`.cities-acc`) de
 * `_reference/index.html:701-744`: painéis-foto em accordion (expande no
 * hover/toque), cada um com papel (Matriz/Filial) e UF. `image` alimenta o
 * `.city-panel img` de fundo — os `assets/img/{recife,joao-pessoa,...}.webp`
 * do ref entram no seed via `getMediaId`. Opcional (não `required`) para não
 * quebrar os seeds existentes (`src/seed/home.ts`/`pages.ts`) que ainda não
 * setam `image`; o Component filtra e só renderiza painéis com foto — o
 * bloco fica vazio até a mídia ser religada (mesmo padrão do Hero).
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
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}
