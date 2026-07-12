import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: { useAsTitle: 'title', group: 'Conteúdo', defaultColumns: ['title', 'slug', 'updatedAt'] },
  access: { read: () => true },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: "Use 'home' para a página inicial. Sem acento (ex.: solucoes)." },
    },
    { name: 'layout', type: 'blocks', blocks: [] },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
  ],
}
