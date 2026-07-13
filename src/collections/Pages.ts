import type { CollectionConfig } from 'payload'
import { citiesBlock } from '@/blocks/Cities/config'
import { ctaBandBlock } from '@/blocks/CTABand/config'
import { featureGridBlock } from '@/blocks/FeatureGrid/config'
import { garanteBlock } from '@/blocks/Garante/config'
import { heroBlock } from '@/blocks/Hero/config'
import { richTextBlock } from '@/blocks/RichText/config'
import { statsBlock } from '@/blocks/Stats/config'
import { revalidatePage } from '@/lib/revalidate'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: { useAsTitle: 'title', group: 'Conteúdo', defaultColumns: ['title', 'slug', 'updatedAt'] },
  access: { read: () => true },
  versions: { drafts: true },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidatePage(doc.slug)
      },
    ],
    afterDelete: [
      ({ doc }) => {
        revalidatePage(doc.slug)
      },
    ],
  },
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
    {
      name: 'layout',
      type: 'blocks',
      blocks: [
        heroBlock,
        statsBlock,
        featureGridBlock,
        garanteBlock,
        citiesBlock,
        ctaBandBlock,
        richTextBlock,
      ],
    },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
  ],
}
