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
          'Texto puro do blockquote. O ref tem um trecho final em `<em>` (cor ice) — mesma limitação já documentada em `WordsSection`/`PartnerSplit`: sem contrapartida em texto puro, o destaque é descartado.',
      },
    },
    { name: 'cite', type: 'text' },
  ],
}
