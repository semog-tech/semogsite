/**
 * Conteúdo dos "Termos de Uso" (slug `termos`) — o `title`/`updatedText`/
 * corpo vêm de `content/legal/termos.mdx` (Task 3: o bloco `richText`
 * renderiza MDX, não mais lexical — ver `src/blocks/RichText/Component.tsx`).
 */
import type { PageData } from '@/types/content'
import { getLegalPage } from '../lib/legal'

const page = getLegalPage('termos')

export const termos: PageData = {
  slug: 'termos',
  // Rótulo administrativo real no Payload (confirmado via GET /api/pages).
  title: 'Termos de Uso',
  layout: [
    { blockType: 'legalHero', headline: page.title, updatedText: page.updatedText },
    { blockType: 'richText', legal: true, body: page.body },
  ],
}
