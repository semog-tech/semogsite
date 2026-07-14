import type { Block } from 'payload'

/**
 * Bloco de destaque "Semog Garante" — fiel à banda conceitual `.g-band-home`
 * de `_reference/index.html` (aprofundada em `_reference/garante.html`):
 * a garantia de inadimplência zero, seus diferenciais ("Como funciona",
 * `.g-step`) e um CTA. `cta` é opcional (grupo sem subfields obrigatórios,
 * mesmo padrão do `globals/Header.ts:17-22`) para permitir o bloco só com
 * o texto de destaque, sem botão.
 *
 * `video`/`poster` + `priceChip` alimentam a variante full-bleed
 * `.g-band-home` da home (`index.html:678-698`): quando `video` (ou, na
 * falta dele, `poster`) está preenchido, o Component troca para essa banda
 * de vídeo com o chip "1%" — os campos de `features`/`note` (steps) do uso
 * em `/garante` continuam existindo e funcionando sem vídeo.
 *
 * `pct` (sem `video`/`poster`) alimenta a variante split de 2 colunas
 * `.g-band` das landings de cidade (ex.:
 * `_reference/administradora-de-condominios-recife.html:176-190,382-402`):
 * h2+p+CTA à esquerda, porcentagem tipográfica gigante à direita — distinta
 * do chip de vidro `.pct-chip` da variante de vídeo e da grade de `features`
 * (steps) do uso padrão em `/garante`.
 */
export const garanteBlock: Block = {
  slug: 'garante',
  interfaceName: 'GaranteBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    { name: 'video', type: 'upload', relationTo: 'media' },
    { name: 'poster', type: 'upload', relationTo: 'media' },
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
    {
      name: 'priceChip',
      type: 'group',
      admin: {
        description:
          'Chip de vidro "1%" da banda com vídeo (`.pct-chip`), ex.: valor "1%" + legenda.',
      },
      fields: [
        { name: 'value', type: 'text' },
        { name: 'label', type: 'text' },
      ],
    },
    { name: 'note', type: 'text' },
    {
      name: 'pct',
      type: 'group',
      admin: {
        description:
          'Só sem `video`/`poster`. Porcentagem tipográfica gigante da variante split `.g-band` das landings de cidade (`.pct`/`.pct-l`), ex.: valor "1%" + legenda "da arrecadação. Só isso."',
      },
      fields: [
        { name: 'value', type: 'text' },
        { name: 'label', type: 'text' },
      ],
    },
  ],
}
