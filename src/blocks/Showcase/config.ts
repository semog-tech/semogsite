import type { Block } from 'payload'

/**
 * Seção split genérica (texto + placeholder de mídia), fiel ao par
 * "Prestação de contas" (`.showcase`, `_reference/solucoes.html:522-555`)
 * e "Semog One" (`.tech`/`.one-card`, `_reference/solucoes.html:644-687`):
 * ambas sem `sec-light`, texto de apoio + grade de features e uma peça
 * visual central. Aqui a mídia (`prestacao-contas.webp`/print do ERP) vira
 * **placeholder** — sem imagem real, essas chaves S3 entram depois — e
 * `mediaSide` permite alternar de que lado ela fica, para reaproveitar o
 * bloco em ambas as seções sem duplicar código. `cta` é opcional (grupo sem
 * subfields obrigatórios, mesmo padrão do `AppShowcaseBlock`/`GaranteBlock`).
 */
export const showcaseBlock: Block = {
  slug: 'showcase',
  interfaceName: 'ShowcaseBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    {
      name: 'features',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
      ],
    },
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'href', type: 'text' },
      ],
    },
    {
      name: 'mediaSide',
      type: 'select',
      options: ['left', 'right'],
      defaultValue: 'right',
    },
  ],
}
