import type { Block } from 'payload'

/**
 * Grid de cards, duas variantes escolhidas por `variant`:
 *
 * - `dark` (default) — fiel ao padrão `.why-card` visto em
 *   `_reference/incorporadoras.html`: cards ice-tint (gradiente quase
 *   transparente + borda `--line`), `icon` é um glifo/emoji livre em badge
 *   circular, ou `iconSvg` (glifo SVG nu 34x34 stroke ice-400, `.glyph`) —
 *   ver `light`/`white`/`columns`/`stagger` abaixo.
 * - `light` — fiel a `.svc.sec-light` > `.svc-grid` > `.svc-card` de
 *   `_reference/administracao-de-condominios.html:87-105,230-286`: cards
 *   BRANCOS (não o branco automático de `.sec-light .why-card`, o ref
 *   define `.svc-card` com sombra/borda próprias) sobre seção clara, ícone
 *   em badge quadrado com gradiente da marca. `features[].iconSvg` carrega
 *   o SVG inline de verdade (9 ícones distintos no ref).
 *
 * `light`/`white`/`columns`/`stagger` são independentes de `variant` e
 * servem o caso `_reference/incorporadoras.html:109-122,280-309` ("Por que
 * Semog", `.why-grid.sec-light.white` — o MESMO card `.why-card` do variant
 * `dark`, só que dentro de uma seção clara, 2 colunas, com `iconSvg` como
 * glifo nu (não o glifo texto/pílula) e o grupo inteiro entrando via
 * `Stagger` (`data-stagger` no ref) em vez de `Reveal` por card:
 * - `light` (checkbox) — envolve o grid em `Section light` mesmo com
 *   `variant:'dark'` (o variant `light` já é sempre claro, por isso este
 *   campo é ignorado nesse caso). As classes Tailwind do card (`border-line`/
 *   `text-fg-2`/etc.) resolvem os valores de `.sec-light` automaticamente —
 *   são CSS custom properties (`--line`/`--text-2`), não hex fixo.
 * - `white` (checkbox) — só com `light` ativo, troca `.sec-light` por
 *   `.sec-light white` (mesmo padrão de `Pillars`/`Faq`).
 * - `columns` (select, default `3`) — `2` reproduz `.why-grid` (2 colunas);
 *   `3` mantém o grid genérico usado em toda outra página.
 * - `stagger` (checkbox) — força entrada em grupo via `Stagger` mesmo no
 *   variant `dark` (o variant `light` já sempre usa `Stagger`).
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
    {
      name: 'light',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Só com `variant:"dark"` (o variant `light` já é sempre claro). Envolve o grid em `Section light`, fiel a `.why-grid.sec-light` de `_reference/incorporadoras.html`.',
      },
    },
    {
      name: 'white',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Só com `light` ativo — troca `.sec-light` por `.sec-light white`.' },
    },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      options: ['2', '3'],
      admin: { description: '`2` reproduz `.why-grid` (2 colunas); `3` é o grid genérico padrão.' },
    },
    {
      name: 'stagger',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Só com `variant:"dark"` (o variant `light` já sempre usa `Stagger`). Troca a entrada por card (`Reveal`) por entrada em grupo (`data-stagger` no ref).',
      },
    },
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text' },
    {
      name: 'titleAccent',
      type: 'text',
      admin: {
        description:
          'Trecho final de `title` a destacar em gradiente, ex.: "em um só contrato." em "Tudo que o condomínio precisa, em um só contrato." Usa `.gx` quando a seção renderiza clara (variant `light` OU `light:true`) e `.gx-ice` quando escura (mesmo padrão de `Benefits.titleAccent`).',
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
            description:
              'Glifo/emoji livre — só é renderizado no variant escuro, e só quando `iconSvg` não está preenchido.',
          },
        },
        {
          name: 'iconSvg',
          type: 'textarea',
          admin: {
            description:
              'Markup interno do ícone (paths/circles/rects, SEM a tag <svg> em volta), ex.: `<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>`. No variant claro, renderiza dentro do badge `.ic` (viewBox 24x24, stroke branco, 22x22). No variant escuro, renderiza como glifo nu `.glyph` (viewBox 24x24, stroke ice-400, 34x34) — fiel a `_reference/incorporadoras.html`\'s `.why-card .glyph` — e tem prioridade sobre `icon`.',
          },
        },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
      ],
    },
  ],
}
