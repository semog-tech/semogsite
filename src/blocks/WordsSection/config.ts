import type { Block } from 'payload'

/**
 * Fiel à `.manifesto` de `_reference/index.html:551-555`: um parágrafo grande
 * revelado palavra a palavra no scroll (`data-words`). `eyebrow` é opcional
 * (o ref não usa na home); `text` é o parágrafo.
 *
 * `variant: 'problem'` troca `.manifesto` por `.g-problem`, fiel a
 * `.g-problem` de `_reference/garante.html:114-120` (estilo inline da
 * própria página) — a seção "O problema" do hero de `/garante`: mesmo
 * `Words` (scrub palavra-a-palavra), padding/tipografia próprios (levemente
 * menores que o manifesto).
 */
export const wordsSectionBlock: Block = {
  slug: 'wordsSection',
  interfaceName: 'WordsSectionBlock',
  fields: [
    {
      name: 'variant',
      type: 'select',
      options: ['manifesto', 'problem'],
      defaultValue: 'manifesto',
    },
    { name: 'eyebrow', type: 'text' },
    { name: 'text', type: 'textarea', required: true },
  ],
}
