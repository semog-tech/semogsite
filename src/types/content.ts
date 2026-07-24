import type { Block } from './blocks'

/** Uma página estática: o que o catch-all e o `RenderBlocks` precisam. */
export interface PageData {
  slug: string
  meta?: { title?: string | null; description?: string | null; image?: string | null }
  layout: Block[]
}
