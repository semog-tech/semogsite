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
 *
 * `variant: 'argument'` troca `.manifesto` por `.argument`, fiel a
 * `.argument` de `_reference/incorporadoras.html:72-79,204-216` (estilo
 * inline da própria página) — a seção "Argumento": mesmo `Words` no
 * parágrafo grande (`text`), mais um 2º parágrafo (`sub`, `data-reveal`
 * simples, sem scrub) ausente nas outras 2 variantes — por isso os campos
 * ficam com classes próprias (`.big`/`.sub`) em vez do seletor de tag `p`
 * usado por `manifesto`/`problem`.
 */
export const wordsSectionBlock: Block = {
  slug: 'wordsSection',
  interfaceName: 'WordsSectionBlock',
  fields: [
    {
      name: 'variant',
      type: 'select',
      options: ['manifesto', 'problem', 'argument'],
      defaultValue: 'manifesto',
    },
    { name: 'eyebrow', type: 'text' },
    { name: 'text', type: 'textarea', required: true },
    {
      name: 'sub',
      type: 'textarea',
      admin: {
        description:
          'Parágrafo de apoio abaixo de `text` (`.argument .sub`), revelado em bloco via `Reveal` (sem scrub). Só usado pelo variant `argument` — ignorado nas outras 2.',
      },
    },
  ],
}
