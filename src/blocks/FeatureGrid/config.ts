import type { Block } from 'payload'

/**
 * Grid de cards, duas variantes escolhidas por `variant`:
 *
 * - `dark` (default) — fiel ao padrão `.why-card` visto em
 *   `_reference/incorporadoras.html`: cards ice-tint sobre fundo escuro,
 *   `icon` é um glifo/emoji livre em badge circular.
 * - `light` — fiel a `.svc.sec-light` > `.svc-grid` > `.svc-card` de
 *   `_reference/administracao-de-condominios.html:87-105,230-286`: cards
 *   BRANCOS (não o branco automático de `.sec-light .why-card`, o ref
 *   define `.svc-card` com sombra/borda próprias) sobre seção clara, ícone
 *   em badge quadrado com gradiente da marca. `features[].iconSvg` carrega
 *   o SVG inline de verdade (9 ícones distintos no ref) — `icon` (glifo de
 *   texto) continua servindo o variant `dark`, que nunca teve biblioteca de
 *   ícones.
 */
export const featureGridBlock: Block = {
  slug: 'featureGrid',
  interfaceName: 'FeatureGridBlock',
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'dark',
      options: [
        { label: 'Escuro (ice-tint sobre navy)', value: 'dark' },
        { label: 'Claro (.svc-card branco sobre sec-light)', value: 'light' },
      ],
    },
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text' },
    {
      name: 'titleAccent',
      type: 'text',
      admin: {
        description:
          'Trecho final de `title` a destacar em gradiente, ex.: "em um só contrato." em "Tudo que o condomínio precisa, em um só contrato." Usa `.gx` no variant claro e `.gx-ice` no escuro (mesmo padrão de `Benefits.titleAccent`).',
      },
    },
    {
      name: 'features',
      type: 'array',
      fields: [
        {
          name: 'icon',
          type: 'text',
          admin: {
            description: 'Glifo/emoji livre — só é renderizado no variant escuro (sem `iconSvg`).',
          },
        },
        {
          name: 'iconSvg',
          type: 'textarea',
          admin: {
            description:
              'Markup interno do ícone (paths/circles/rects, SEM a tag <svg> em volta), ex.: `<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>`. Só é renderizado no variant claro, dentro do badge `.ic` (viewBox 24x24, stroke branco).',
          },
        },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
      ],
    },
  ],
}
