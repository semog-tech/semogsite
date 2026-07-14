import type React from 'react'
import type { Page } from '@/payload-types'
import { AppShowcaseBlock } from './AppShowcase/Component'
import { BenefitsBlock } from './Benefits/Component'
import { BlogListBlock } from './BlogList/Component'
import { CitiesBlock } from './Cities/Component'
import { ClubeBeneficiosBlock } from './ClubeBeneficios/Component'
import { CompareBlock } from './Compare/Component'
import { ContactInfoBlock } from './ContactInfo/Component'
import { CTABandBlock } from './CTABand/Component'
import { CustoChecklistBlock } from './CustoChecklist/Component'
import { DevQuoteBlock } from './DevQuote/Component'
import { FaqBlock } from './Faq/Component'
import { FeatureGridBlock } from './FeatureGrid/Component'
import { FormEmbedBlock } from './FormEmbed/Component'
import { GaranteBlock } from './Garante/Component'
import { HeroBlock } from './Hero/Component'
import { HumanQuoteBlock } from './HumanQuote/Component'
import { PartnerSplitBlock } from './PartnerSplit/Component'
import { PillarsBlock } from './Pillars/Component'
import { PrestacaoBlock } from './Prestacao/Component'
import { PriceMomentBlock } from './PriceMoment/Component'
import { ProcessoTimelineBlock } from './ProcessoTimeline/Component'
import { ProdutosGridBlock } from './ProdutosGrid/Component'
import { RegistrosBlock } from './Registros/Component'
import { RichTextBlock } from './RichText/Component'
import { ShowcaseBlock } from './Showcase/Component'
import { SociosBlock } from './Socios/Component'
import { SolucoesBentoBlock } from './SolucoesBento/Component'
import { SolutionSplitBlock } from './SolutionSplit/Component'
import { StatsBlock } from './Stats/Component'
import { TecnologiaRoadmapBlock } from './TecnologiaRoadmap/Component'
import { TestimonialsBlock } from './Testimonials/Component'
import { TimelineBlock } from './Timeline/Component'
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
  timeline: TimelineBlock,
  solucoesBento: SolucoesBentoBlock,
  solutionSplit: SolutionSplitBlock,
  produtosGrid: ProdutosGridBlock,
  featureGrid: FeatureGridBlock,
  garante: GaranteBlock,
  cities: CitiesBlock,
  humanQuote: HumanQuoteBlock,
  prestacao: PrestacaoBlock,
  tecnologiaRoadmap: TecnologiaRoadmapBlock,
  clubeBeneficios: ClubeBeneficiosBlock,
  socios: SociosBlock,
  registros: RegistrosBlock,
  appShowcase: AppShowcaseBlock,
  testimonials: TestimonialsBlock,
  faq: FaqBlock,
  ctaBand: CTABandBlock,
  custoChecklist: CustoChecklistBlock,
  richText: RichTextBlock,
  blogList: BlogListBlock,
  showcase: ShowcaseBlock,
  benefits: BenefitsBlock,
  contactInfo: ContactInfoBlock,
  formEmbed: FormEmbedBlock,
  priceMoment: PriceMomentBlock,
  compare: CompareBlock,
  partnerSplit: PartnerSplitBlock,
  devQuote: DevQuoteBlock,
  processoTimeline: ProcessoTimelineBlock,
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
