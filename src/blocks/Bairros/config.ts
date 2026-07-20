import type { Block } from 'payload'

/**
 * Bloco novo — lista de bairros atendidos em formato de pills, fiel a
 * `.hood`/`.hood-pills` das landings de cidade do ref (ex.:
 * `_reference/administradora-de-condominios-recife.html:340-356`). Nenhum
 * bloco do inventário anterior modelava esse padrão (tag/pill list), daí um
 * bloco dedicado em vez de forçar `FeatureGrid`/`ValuesMarquee`.
 */
export const bairrosBlock: Block = {
  slug: 'bairros',
  interfaceName: 'BairrosBlock',
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      fields: [{ name: 'label', type: 'text', required: true }],
    },
    {
      name: 'note',
      type: 'textarea',
      admin: {
        description:
          'Nota de apoio abaixo dos pills, ex.: "Também atendemos Olinda, Jaboatão dos Guararapes, Paulista, Região Metropolitana do Recife." (`.hood .note` do ref).',
      },
    },
  ],
}
