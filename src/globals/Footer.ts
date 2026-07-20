import type { GlobalConfig } from 'payload'

export const Footer: GlobalConfig = {
  slug: 'footer',
  admin: { group: 'Layout' },
  access: { read: () => true },
  fields: [
    {
      // Banda de CTA no topo do rodapé (`.foot-cta`): slogan com um trecho
      // destacado em `<em>` (semog.css:392-397) + botão. Fiel a
      // `_reference/index.html` (footer: "Preocupe-se apenas <em>em morar.</em>").
      name: 'footCta',
      type: 'group',
      fields: [
        { name: 'slogan', type: 'text' },
        { name: 'sloganEm', type: 'text' },
        {
          name: 'cta',
          type: 'group',
          fields: [
            { name: 'label', type: 'text' },
            { name: 'href', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'columns',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'links',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'href', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      // Links legais em linha no `.footer-bottom` (semog.css:414-421).
      name: 'legalLinks',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
    { name: 'bottomText', type: 'text' },
  ],
}
