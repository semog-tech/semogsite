import type { Block } from 'payload'

/**
 * Fiel à `.solutions` de `_reference/index.html:576-625`: bento com 1 card
 * alto (`.sol-card.tall`) + N cards empilhados numa coluna (`.sol-col`).
 * Cada card é um link inteiro (imagem de fundo + título/texto + seta "go"),
 * revelado via `Reveal` com zoom da imagem no hover. `tall` marca qual card
 * ocupa a coluna larga; `tag` é opcional — o ref não usa em nenhum card
 * desta seção, mas o campo existe para reuso do bloco (ex.: solucoes.html).
 */
export const solucoesBentoBlock: Block = {
  slug: 'solucoesBento',
  interfaceName: 'SolucoesBentoBlock',
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
        { name: 'tag', type: 'text' },
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea', required: true },
        { name: 'href', type: 'text' },
        {
          name: 'tall',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Ocupa o card alto (coluna larga) do bento.' },
        },
      ],
    },
  ],
}
