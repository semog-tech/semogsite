import type React from 'react'
import type { Page } from '@/payload-types'
import { CTABandBlock } from './CTABand/Component'
import { FeatureGridBlock } from './FeatureGrid/Component'
import { HeroBlock } from './Hero/Component'
import { RichTextBlock } from './RichText/Component'
import { StatsBlock } from './Stats/Component'

type Block = NonNullable<Page['layout']>[number]
// biome-ignore lint/suspicious/noExplicitAny: cada componente valida seu próprio bloco
const map: Record<string, (props: any) => React.ReactNode> = {
  hero: HeroBlock,
  stats: StatsBlock,
  featureGrid: FeatureGridBlock,
  ctaBand: CTABandBlock,
  richText: RichTextBlock,
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
