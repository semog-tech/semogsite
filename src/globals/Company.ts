import type { GlobalConfig } from 'payload'

export const Company: GlobalConfig = {
  slug: 'company',
  admin: { group: 'Layout' },
  access: { read: () => true },
  fields: [
    {
      name: 'addresses',
      type: 'array',
      fields: [
        { name: 'city', type: 'text', required: true },
        { name: 'uf', type: 'text', required: true },
        { name: 'address', type: 'text', required: true },
        { name: 'phone', type: 'text' },
        { name: 'creci', type: 'text' },
        { name: 'abadi', type: 'text' },
        { name: 'secovi', type: 'text' },
      ],
    },
    { name: 'whatsapp', type: 'text' },
  ],
}
