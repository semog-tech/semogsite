import type React from 'react'
import type { Page } from '@/payload-types'
import { AppShowcaseBlock } from './AppShowcase/Component'
import { BenefitsBlock } from './Benefits/Component'
import { BlogListBlock } from './BlogList/Component'
import { CitiesBlock } from './Cities/Component'
import { ContactInfoBlock } from './ContactInfo/Component'
import { CTABandBlock } from './CTABand/Component'
import { FaqBlock } from './Faq/Component'
import { FeatureGridBlock } from './FeatureGrid/Component'
import { FormEmbedBlock } from './FormEmbed/Component'
import { GaranteBlock } from './Garante/Component'
import { HeroBlock } from './Hero/Component'
import { PillarsBlock } from './Pillars/Component'
import { RegistrosBlock } from './Registros/Component'
import { RichTextBlock } from './RichText/Component'
import { ShowcaseBlock } from './Showcase/Component'
import { StatsBlock } from './Stats/Component'
import { TestimonialsBlock } from './Testimonials/Component'
import { ValuesMarqueeBlock } from './ValuesMarquee/Component'
import { WordsSectionBlock } from './WordsSection/Component'

type Block = NonNullable<Page['layout']>[number]
// biome-ignore lint/suspicious/noExplicitAny: cada componente valida seu próprio bloco
const map: Record<string, (props: any) => React.ReactNode> = {
  hero: HeroBlock,
  stats: StatsBlock,
  valuesMarquee: ValuesMarqueeBlock,
  wordsSection: WordsSectionBlock,
  pillars: PillarsBlock,
  featureGrid: FeatureGridBlock,
  garante: GaranteBlock,
  cities: CitiesBlock,
  registros: RegistrosBlock,
  appShowcase: AppShowcaseBlock,
  testimonials: TestimonialsBlock,
  faq: FaqBlock,
  ctaBand: CTABandBlock,
  richText: RichTextBlock,
  blogList: BlogListBlock,
  showcase: ShowcaseBlock,
  benefits: BenefitsBlock,
  contactInfo: ContactInfoBlock,
  formEmbed: FormEmbedBlock,
}

export function RenderBlocks({ blocks }: { blocks?: Block[] | null }) {
  if (!blocks?.length) return null
  return (
    <>
      {blocks.map((block, i) => {
        const Comp = map[block.blockType]
        if (!Comp) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`[RenderBlocks] Tipo de bloco desconhecido: "${block.blockType}"`)
          }
          return null
        }
        return <Comp key={block.id ?? i} {...block} />
      })}
    </>
  )
}
