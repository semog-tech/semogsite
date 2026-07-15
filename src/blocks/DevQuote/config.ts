import type { Block } from 'payload'

/**
 * Banda de depoimento fiel a `.dev-quote` de
 * `_reference/incorporadoras.html:125-136,311-317` (estilo inline da própria
 * página): blockquote grande revelado palavra a palavra (`Words`, mesma
 * primitiva do `WordsSection`) + `cite`. Bloco novo — não existia CMS
 * equivalente antes desta task (ver `.superpowers/sdd/audit-servicos.md`,
 * seção `/incorporadoras`, linha "QUOTE" — **MISSING**).
 */
export const devQuoteBlock: Block = {
  slug: 'devQuote',
  interfaceName: 'DevQuoteBlock',
  fields: [
    {
      name: 'quote',
      type: 'textarea',
      required: true,
      admin: {
        description:
          'Aceita `<em>...</em>` embutido para o trecho final em destaque (cor ice) do ref, ex.: "A Semog entrega a convivência." em `_reference/incorporadoras.html:314` (`.dev-quote blockquote em`) — `Words` (mesma primitiva do `WordsSection`) preserva a marcação através do scrub palavra-a-palavra.',
      },
    },
    { name: 'cite', type: 'text' },
  ],
}
