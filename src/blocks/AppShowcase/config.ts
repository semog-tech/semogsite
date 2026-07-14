import type { Block } from 'payload'

/**
 * Seção do aplicativo, fiel a `.app-band`/`.app-grid`/`.app-media`/
 * `.app-feats` de `_reference/solucoes.html:618-642`: o print do app
 * (`image`, renderiza como `.app-media` — `max-width:400px`, centralizado)
 * e, do outro lado, texto + grade de features (boletos, reservas,
 * assembleias...). `image` não é `required`: o bloco é reutilizável pelo
 * admin em qualquer página (`Pages.ts`), então precisa continuar
 * funcionando sem mídia enviada ainda — o Component só omite a coluna de
 * imagem nesse caso (mesmo padrão de `SolutionSplit`/`MediaCol`). `cta` é
 * opcional (grupo sem subfields obrigatórios, mesmo padrão do
 * `GaranteBlock`/`globals/Header.ts:17-22`) — o ref não tem CTA nessa
 * seção, mas o campo fica disponível.
 */
export const appShowcaseBlock: Block = {
  slug: 'appShowcase',
  interfaceName: 'AppShowcaseBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
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
