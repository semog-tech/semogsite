import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  typescript: { interface: 'SiteSettings' },
  admin: { group: 'Configurações' },
  access: { read: () => true },
  fields: [
    { name: 'defaultTitle', type: 'text' },
    { name: 'defaultDescription', type: 'textarea' },
    { name: 'ogImage', type: 'upload', relationTo: 'media' },
    {
      name: 'social',
      type: 'group',
      fields: [
        { name: 'instagram', type: 'text' },
        { name: 'linkedin', type: 'text' },
        { name: 'facebook', type: 'text' },
      ],
    },
  ],
}
