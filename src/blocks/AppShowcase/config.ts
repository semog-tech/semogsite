import type { Block } from 'payload'

/**
 * Seção do aplicativo, fiel a `.app-band`/`.app-grid`/`.app-feats` de
 * `_reference/solucoes.html:618-642`: texto + grade de features (boletos,
 * reservas, assembleias...) e o print do app (`app-media`). `cta` é
 * opcional (grupo sem subfields obrigatórios, mesmo padrão do
 * `GaranteBlock`/`globals/Header.ts:17-22`) — o ref não tem CTA nessa
 * seção, mas o campo fica disponível. Sem imagem: `app-phone.webp` entra
 * depois, com S3.
 */
export const appShowcaseBlock: Block = {
  slug: 'appShowcase',
  interfaceName: 'AppShowcaseBlock',
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
  ],
}
