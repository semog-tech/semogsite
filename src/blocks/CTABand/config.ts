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
    {
      name: 'buttonVariant',
      type: 'select',
      options: ['white', 'primary'],
      defaultValue: 'white',
      admin: {
        description:
          'Só no variant `centered`. O `.final-cta` de `_reference/index.html`/`garante.html`/`administracao-de-condominios.html` sempre usa `.btn-white`, mas `_reference/incorporadoras.html:325` usa `.btn-primary` — daí este campo, default `white` para preservar o comportamento das 3 páginas já seedadas.',
      },
    },
    {
      name: 'headingMaxWidth',
      type: 'text',
      defaultValue: '20ch',
      admin: {
        description:
          'Só no variant `centered`. `max-width` do `.final-cta h2` do ref — a maioria das páginas (`administracao-de-condominios.html`/`incorporadoras.html`/`semog.html`/`solucoes.html`/as 4 landings de cidade) usa `20ch` (o default aqui, sem `font-size` próprio), mas `index.html` usa `16ch` e `garante.html` usa `18ch` — ambas também com `headingFontSize` próprio.',
      },
    },
    {
      name: 'headingFontSize',
      type: 'text',
      admin: {
        description:
          'Só no variant `centered`. `font-size` do `.final-cta h2` do ref, ex.: `clamp(2.4rem, 5.6vw, 4.6rem)` em `index.html`, `clamp(2.2rem, 5vw, 4.2rem)` em `garante.html`. Deixe em branco para o tamanho padrão de `h2` (`--text-h2`) — caso da maioria das páginas.',
      },
    },
  ],
}
