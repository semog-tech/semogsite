import type { Block, Field } from 'payload'

function columnFields(): Field[] {
  return [
    { name: 'tag', type: 'text', required: true },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [{ name: 'text', type: 'text', required: true }],
    },
  ]
}

/**
 * Comparação antes/depois em 2 cartões lado a lado — fiel a
 * `.g-compare`/`.cmp-grid`/`.cmp-col` de `_reference/garante.html:167-195`
 * (estilo inline da própria página, ver `.superpowers/sdd/audit-servicos.md`,
 * `/garante` linha "ANTES / DEPOIS": bloco novo, o `Showcase` reaproveitado
 * antes perdia o visual de 2 cartões + glow). `before`/`after` são os 2
 * cartões (`.cmp-col`/`.cmp-col.after` — o 2º tem fundo `--grad-band` +
 * `--shadow-glow`, sempre a coluna "Com o Garante").
 */
export const compareBlock: Block = {
  slug: 'compare',
  interfaceName: 'CompareBlock',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'before', type: 'group', fields: columnFields() },
    { name: 'after', type: 'group', fields: columnFields() },
  ],
}
