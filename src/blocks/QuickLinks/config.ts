import type { Block } from 'payload'

/**
 * Atendimento rápido (`.quick`/`.quick-card`), fiel a
 * `_reference/contato.html:207-231`: 3 atalhos de contato (WhatsApp/e-mail/
 * proposta comercial no ref), cada um um `<a class="quick-card">` inteiro —
 * ícone de vidro + título + descrição + valor em destaque (telefone,
 * e-mail ou "Solicitar proposta →"). Bloco novo — nenhum item do inventário
 * anterior modelava "ícone + link inteiro em card", daí não reaproveitar
 * `FeatureGrid`/`ValuesMarquee`.
 */
export const quickLinksBlock: Block = {
  slug: 'quickLinks',
  interfaceName: 'QuickLinksBlock',
  fields: [
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      maxRows: 3,
      admin: {
        description:
          'O ref sempre mostra exatamente 3 atalhos (WhatsApp/e-mail/proposta) — `.quick-grid` é uma grade fixa de 3 colunas.',
      },
      fields: [
        {
          name: 'icon',
          type: 'select',
          required: true,
          options: ['whatsapp', 'email', 'document'],
          admin: {
            description:
              'Glifo de vidro do card (`.quick-card .ic`), fiel aos 3 SVGs inline de `_reference/contato.html:212,218,224` (WhatsApp/envelope/documento com check).',
          },
        },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
        {
          name: 'value',
          type: 'text',
          required: true,
          admin: {
            description:
              'Linha em destaque no fim do card (`.quick-card .val`), ex.: "(81) 9 9999-9999" ou "Solicitar proposta →".',
          },
        },
        { name: 'href', type: 'text', required: true },
        {
          name: 'external',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description:
              'Abre em nova aba (`target="_blank" rel="noopener"`) — o card de WhatsApp do ref usa isso, e-mail (`mailto:`) e o link interno pra `/proposta` não.',
          },
        },
      ],
    },
  ],
}
