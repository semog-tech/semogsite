import type { CollectionConfig } from 'payload'
import { appShowcaseBlock } from '@/blocks/AppShowcase/config'
import { bairrosBlock } from '@/blocks/Bairros/config'
import { benefitsBlock } from '@/blocks/Benefits/config'
import { blogFeaturedBlock } from '@/blocks/BlogFeatured/config'
import { blogListBlock } from '@/blocks/BlogList/config'
import { citiesBlock } from '@/blocks/Cities/config'
import { clubeBeneficiosBlock } from '@/blocks/ClubeBeneficios/config'
import { compareBlock } from '@/blocks/Compare/config'
import { contactInfoBlock } from '@/blocks/ContactInfo/config'
import { ctaBandBlock } from '@/blocks/CTABand/config'
import { custoChecklistBlock } from '@/blocks/CustoChecklist/config'
import { devQuoteBlock } from '@/blocks/DevQuote/config'
import { faqBlock } from '@/blocks/Faq/config'
import { featureGridBlock } from '@/blocks/FeatureGrid/config'
import { formEmbedBlock } from '@/blocks/FormEmbed/config'
import { garanteBlock } from '@/blocks/Garante/config'
import { heroBlock } from '@/blocks/Hero/config'
import { humanQuoteBlock } from '@/blocks/HumanQuote/config'
import { newsletterBlock } from '@/blocks/Newsletter/config'
import { partnerSplitBlock } from '@/blocks/PartnerSplit/config'
import { pillarsBlock } from '@/blocks/Pillars/config'
import { prestacaoBlock } from '@/blocks/Prestacao/config'
import { priceMomentBlock } from '@/blocks/PriceMoment/config'
import { processoTimelineBlock } from '@/blocks/ProcessoTimeline/config'
import { produtosGridBlock } from '@/blocks/ProdutosGrid/config'
import { quickLinksBlock } from '@/blocks/QuickLinks/config'
import { registrosBlock } from '@/blocks/Registros/config'
import { richTextBlock } from '@/blocks/RichText/config'
import { selfServeBlock } from '@/blocks/SelfServe/config'
import { showcaseBlock } from '@/blocks/Showcase/config'
import { sociosBlock } from '@/blocks/Socios/config'
import { solucoesBentoBlock } from '@/blocks/SolucoesBento/config'
import { solutionSplitBlock } from '@/blocks/SolutionSplit/config'
import { statsBlock } from '@/blocks/Stats/config'
import { tecnologiaRoadmapBlock } from '@/blocks/TecnologiaRoadmap/config'
import { testimonialsBlock } from '@/blocks/Testimonials/config'
import { timelineBlock } from '@/blocks/Timeline/config'
import { trustPanelBlock } from '@/blocks/TrustPanel/config'
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
        timelineBlock,
        solucoesBentoBlock,
        solutionSplitBlock,
        produtosGridBlock,
        featureGridBlock,
        garanteBlock,
        citiesBlock,
        humanQuoteBlock,
        prestacaoBlock,
        tecnologiaRoadmapBlock,
        clubeBeneficiosBlock,
        sociosBlock,
        registrosBlock,
        appShowcaseBlock,
        testimonialsBlock,
        faqBlock,
        ctaBandBlock,
        custoChecklistBlock,
        richTextBlock,
        blogListBlock,
        blogFeaturedBlock,
        newsletterBlock,
        showcaseBlock,
        benefitsBlock,
        contactInfoBlock,
        formEmbedBlock,
        priceMomentBlock,
        compareBlock,
        partnerSplitBlock,
        devQuoteBlock,
        processoTimelineBlock,
        bairrosBlock,
        quickLinksBlock,
        selfServeBlock,
        trustPanelBlock,
      ],
    },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
  ],
}
