import type { Block } from 'payload'

/**
 * Fiel à `.human` de `_reference/index.html:747-756`: blockquote gigante com
 * scrub palavra-a-palavra, citação opcional e uma foto com parallax e legenda
 * em chip de vidro. `caption` reproduz o `<span class="cap liquid-glass">`
 * (`"Tecnologia na operação. Gente na relação."` no ref) — conteúdo real da
 * seção, então vira campo em vez de string fixa no Component.
 */
export const humanQuoteBlock: Block = {
  slug: 'humanQuote',
  interfaceName: 'HumanQuoteBlock',
  fields: [
    { name: 'quote', type: 'textarea', required: true },
    { name: 'author', type: 'text' },
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', type: 'text' },
  ],
}
