import type { Block } from 'payload'

/**
 * O momento tipográfico gigante "1%" — fiel a `.g-one` de
 * `_reference/garante.html:143-165` (estilo inline da própria página, ver
 * `.superpowers/sdd/audit-servicos.md`, `/garante` linha "1% MOMENT":
 * "MISSING" antes desta task). `value` é o número gigante em gradiente
 * (`.huge`, `data-reveal="scale"`); `sub`/`fine` são as duas linhas de apoio
 * abaixo (`.sub`/`.fine`).
 */
export const priceMomentBlock: Block = {
  slug: 'priceMoment',
  interfaceName: 'PriceMomentBlock',
  fields: [
    {
      name: 'value',
      type: 'text',
      required: true,
      admin: { description: 'Número gigante em gradiente (`.huge`), ex.: "1%".' },
    },
    { name: 'sub', type: 'text' },
    { name: 'fine', type: 'textarea' },
  ],
}
