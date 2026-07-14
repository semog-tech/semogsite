import type { Block } from 'payload'

/**
 * Fiel à seção "Empresa humana" (`id="socios"`) de `_reference/semog.html`
 * (`.founders.sec-light.white`): `.frame-head` (label) + `.founders-grid`
 * 2 colunas — esquerda `data-reveal="left"` (h2 + texto + `.f-feats`, 3
 * rows que reagem ao hover) / direita `data-reveal="right"` (`image`,
 * `equipe.webp` + legenda em vidro, `.cap.liquid-glass`).
 *
 * Nenhum bloco existente cobre esse layout (FeatureGrid é grid de cards,
 * Pillars é 1 coluna de hover-rows sem split de mídia) — bloco novo.
 */
export const sociosBlock: Block = {
  slug: 'socios',
  interfaceName: 'SociosBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'title', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea', required: true },
      ],
    },
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', type: 'text' },
  ],
}
