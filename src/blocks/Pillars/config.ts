import type { Block } from 'payload'

/**
 * Fiel à `.pillars` de `_reference/index.html:558-573`: linhas `.pillar-row`
 * (título + texto em duas colunas) reveladas no scroll e interativas no hover
 * (padding/cor/glyph). `glyph` é opcional (número ou símbolo à esquerda do
 * título — o ref não usa na home; presente para reuso nas outras páginas).
 *
 * `eyebrow` reproduz o rótulo `.frame-lbl` que antecede as rows em outras
 * páginas que usam este MESMO padrão de hover-rows fora da home (ex.:
 * `.method .frame-lbl` de `_reference/administracao-de-condominios.html:109`,
 * `.g-how .frame-lbl` de `_reference/garante.html:124` — valores CSS
 * idênticos nos dois refs). Renderizado como `Eyebrow` (mesma aproximação
 * já usada em todo o site para `.frame-head`/`.frame-lbl`, ver
 * `Socios/Component.tsx`), não o `.frame-lbl` verbatim (que teria uma linha
 * horizontal em cima em vez do tracinho à esquerda do `.eyebrow`).
 *
 * `tightTop`, default `true`, preserva o comportamento existente (zera o
 * padding-top da `Section`, fiel a `.pillars { padding-top: 0 }` — a seção
 * "cola" na anterior, usado hoje só pela Home/`semog`). Quando a página que
 * reutiliza Pillars NÃO tem esse zero (ex.: `.method` do ref de
 * administração não sobrescreve `padding-block`, então usa o
 * `clamp(5rem,10vw,9rem)` padrão em cima E embaixo), `tightTop: false`
 * mantém o padding-top normal da `Section`.
 *
 * `light`/`white` reproduzem `.sec-light`/`.sec-light.white` — necessário
 * porque `.g-how` de `_reference/garante.html:122-141` (estilo inline da
 * própria página) é uma seção CLARA (ao contrário de `.pillars`/`.method`,
 * escuras); o CSS `.sec-light .pillar-row:hover`/`:hover h3` já existe em
 * `theme.css` (portado de `semog.css:165-177`) e só precisa da classe
 * chegando via `Section`. `compact` reproduz `.g-step h3`/`p`
 * (`_reference/garante.html:139,141`), levemente menores que o `.pillar-row`
 * padrão (`_reference/index.html:172-195`) — mesma família de hover-row,
 * números tipográficos por página.
 */
export const pillarsBlock: Block = {
  slug: 'pillars',
  interfaceName: 'PillarsBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    {
      name: 'tightTop',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Zera o padding-top da seção (`.pillars { padding-top: 0 }` do ref, usado na Home/`semog`). Desmarque quando a página reutilizando este bloco não tem esse zero (ex. `.method` de `/administracao-de-condominios`, `.g-how` de `/garante`).',
      },
    },
    { name: 'light', type: 'checkbox', defaultValue: false },
    { name: 'white', type: 'checkbox', defaultValue: false },
    {
      name: 'compact',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Tipografia levemente menor (`h3`/`p`), fiel a `.g-step` de `/garante` (vs `.pillar-row` padrão da Home).',
      },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'glyph', type: 'text' },
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea', required: true },
      ],
    },
  ],
}
