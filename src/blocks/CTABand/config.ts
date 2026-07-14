import type { Block } from 'payload'

/**
 * Faixa de CTA, com duas variantes escolhidas por `variant`:
 * - `band` (default) — fundo em `--grad-band`, fiel ao padrão `.newsletter`/
 *   `.g-band` visto em `_reference` (título + texto de apoio + um botão).
 * - `centered` — fiel a `.final-cta` de `_reference/index.html:759-770`: CTA
 *   final da home, centralizado, com glow radial e botão magnético.
 */
export const ctaBandBlock: Block = {
  slug: 'ctaBand',
  interfaceName: 'CTABandBlock',
  fields: [
    {
      name: 'variant',
      type: 'select',
      options: ['band', 'centered'],
      defaultValue: 'band',
    },
    { name: 'title', type: 'text', required: true },
    {
      name: 'titleAccent',
      type: 'text',
      admin: {
        description:
          'Trecho final de `title` a destacar em gradiente, ex.: "pela líder." em "Seu condomínio administrado pela líder." (`<span class="gx-ice">`, `_reference/administracao-de-condominios.html:380`). Só no variant `centered` — mesmo padrão de `Benefits.titleAccent`/`FeatureGrid.titleAccent`.',
      },
    },
    { name: 'text', type: 'textarea' },
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
  ],
}
