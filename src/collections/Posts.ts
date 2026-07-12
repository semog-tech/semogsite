import type { CollectionConfig } from 'payload'
import { revalidatePage } from '@/lib/revalidate'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: { useAsTitle: 'title', group: 'Blog', defaultColumns: ['title', 'publishedAt'] },
  access: { read: () => true },
  versions: { drafts: true },
  hooks: {
    afterChange: [
      () => {
        revalidatePage('blog')
      },
    ],
    afterDelete: [
      () => {
        revalidatePage('blog')
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    { name: 'excerpt', type: 'textarea' },
    { name: 'content', type: 'richText' },
    { name: 'category', type: 'relationship', relationTo: 'categories' },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
  ],
}
