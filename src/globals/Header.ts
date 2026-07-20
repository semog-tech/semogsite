import type { GlobalConfig } from 'payload'

export const Header: GlobalConfig = {
  slug: 'header',
  admin: { group: 'Layout' },
  access: { read: () => true },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
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
      name: 'clientArea',
      type: 'group',
      label: 'Área do cliente (botão secundário)',
      fields: [
        { name: 'label', type: 'text', defaultValue: 'Área do cliente' },
        {
          name: 'href',
          type: 'text',
          defaultValue: 'https://semog.superlogica.net/clients/areadocondomino',
        },
      ],
    },
  ],
}
