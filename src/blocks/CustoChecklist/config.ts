import type { Block } from 'payload'

/**
 * Fiel a `.cost.sec-light.white` de
 * `_reference/administracao-de-condominios.html:128-152,311-346`
 * ("Quanto custa uma administradora?"): prosa (h2 + parágrafos + CTA) ao
 * lado de um `.cost-card` — checklist de itens ("O que avaliar antes de
 * contratar"). Bloco novo (não existia CMS equivalente antes desta task —
 * ver `.superpowers/sdd/audit-servicos.md`, seção `/administracao-de-
 * condominios`, linha "MISSING").
 */
export const custoChecklistBlock: Block = {
  slug: 'custoChecklist',
  interfaceName: 'CustoChecklistBlock',
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'titleAccent',
      type: 'text',
      admin: {
        description:
          'Trecho final de `title` a destacar em gradiente `.gx`, ex.: "administradora?" em "Quanto custa uma administradora?"',
      },
    },
    {
      name: 'paragraphs',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [{ name: 'text', type: 'textarea', required: true }],
    },
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
    {
      name: 'checklistLabel',
      type: 'text',
      required: true,
      admin: {
        description:
          'Rótulo acima da lista (`.cost-card .top`), ex.: "O que avaliar antes de contratar".',
      },
    },
    {
      name: 'checklist',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [{ name: 'text', type: 'text', required: true }],
    },
  ],
}
