import type { CollectionConfig } from 'payload'
import { appShowcaseBlock } from '@/blocks/AppShowcase/config'
import { benefitsBlock } from '@/blocks/Benefits/config'
import { blogListBlock } from '@/blocks/BlogList/config'
import { citiesBlock } from '@/blocks/Cities/config'
import { contactInfoBlock } from '@/blocks/ContactInfo/config'
import { ctaBandBlock } from '@/blocks/CTABand/config'
import { faqBlock } from '@/blocks/Faq/config'
import { featureGridBlock } from '@/blocks/FeatureGrid/config'
import { formEmbedBlock } from '@/blocks/FormEmbed/config'
import { garanteBlock } from '@/blocks/Garante/config'
import { heroBlock } from '@/blocks/Hero/config'
import { pillarsBlock } from '@/blocks/Pillars/config'
import { registrosBlock } from '@/blocks/Registros/config'
import { richTextBlock } from '@/blocks/RichText/config'
import { showcaseBlock } from '@/blocks/Showcase/config'
import { statsBlock } from '@/blocks/Stats/config'
import { testimonialsBlock } from '@/blocks/Testimonials/config'
import { valuesMarqueeBlock } from '@/blocks/ValuesMarquee/config'
import { wordsSectionBlock } from '@/blocks/WordsSection/config'
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
        valuesMarqueeBlock,
        wordsSectionBlock,
        pillarsBlock,
        featureGridBlock,
        garanteBlock,
        citiesBlock,
        registrosBlock,
        appShowcaseBlock,
        testimonialsBlock,
        faqBlock,
        ctaBandBlock,
        richTextBlock,
        blogListBlock,
        showcaseBlock,
        benefitsBlock,
        contactInfoBlock,
        formEmbedBlock,
      ],
    },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
  ],
}
