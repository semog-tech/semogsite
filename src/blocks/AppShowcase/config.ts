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
 *
 * `theme`/`imageSecondary`/`rating`/`stores` foram adicionados na Task 5 do
 * Plano 2 pra reusar o bloco na home com uma versão mais rica (tema escuro,
 * segunda tela do app, nota das lojas, selos): `theme` tem `defaultValue:
 * 'light'` e `imageSecondary`/`rating`/`stores` são todos opcionais
 * justamente pra `/solucoes` continuar renderizando com os valores já
 * salvos no banco, sem precisar de migração ou reseed.
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
      name: 'theme',
      type: 'select',
      defaultValue: 'light',
      options: [
        { label: 'Claro (padrão — /solucoes)', value: 'light' },
        { label: 'Escuro profundo (home)', value: 'deep' },
      ],
    },
    {
      name: 'imageSecondary',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Segunda tela, exibida atrás da primeira com rotação leve. Vazio = uma imagem só (comportamento original).',
      },
    },
    {
      name: 'rating',
      type: 'group',
      admin: { description: 'Nota pública do app. Só preencher enquanto bater com as lojas.' },
      fields: [
        { name: 'score', type: 'text', admin: { description: 'Ex.: "4,8"' } },
        { name: 'label', type: 'text' },
      ],
    },
    {
      name: 'stores',
      type: 'group',
      fields: [
        { name: 'appStore', type: 'text', admin: { description: 'URL da ficha na App Store' } },
        { name: 'playStore', type: 'text', admin: { description: 'URL da ficha no Google Play' } },
      ],
    },
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
