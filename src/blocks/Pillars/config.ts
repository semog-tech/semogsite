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
          'Zera o padding-top da seção (`.pillars { padding-top: 0 }` do ref, usado na Home/`semog`). Desmarque quando a página reutilizando este bloco não tem esse zero (ex. `.method` de `/administracao-de-condominios`).',
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
