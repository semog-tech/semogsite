import type { Block } from 'payload'

/**
 * Accordion de perguntas frequentes fiel a `.faq details`/`.faq summary .plus`
 * de `_reference/solucoes.html` e `_reference/garante.html`. `white` reflete
 * a classe `.white` que ALGUNS refs somam a `.faq.sec-light` (ex.:
 * `.faq.sec-light.white` em `_reference/administracao-de-condominios.html:349`,
 * bg `#fff`), contra o `.faq.sec-light` sem `.white` (bg `#f2f4f9`) de
 * `_reference/solucoes.html:727` — default `false` preserva o comportamento
 * existente.
 */
export const faqBlock: Block = {
  slug: 'faq',
  interfaceName: 'FaqBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text' },
    { name: 'white', type: 'checkbox', defaultValue: false },
    {
      name: 'tightTop',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Zera o padding-top da seção (`.faq { padding-top: 0 }`, só na família `administracao-de-condominios*` — a seção cola no `.cost`/checklist anterior). `solucoes`/`garante` não têm esse override.',
      },
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
  ],
}
