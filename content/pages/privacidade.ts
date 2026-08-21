/**
 * Conteúdo da "Política de Privacidade" (slug `privacidade`) — o `title`/
 * `updatedText`/corpo vêm de `content/legal/privacidade.mdx` (Task 3: o
 * bloco `richText` renderiza MDX, não mais lexical — ver
 * `src/blocks/RichText/Component.tsx`).
 */
import type { PageData } from '@/types/content'
import { getLegalPage } from '../lib/legal'

const page = getLegalPage('privacidade')

export const privacidade: PageData = {
  slug: 'privacidade',
  // Rótulo administrativo real no Payload (confirmado via GET /api/pages).
  title: 'Política de Privacidade',
  meta: {
    title: 'Política de Privacidade | Semog',
    description:
      'Como a Semog coleta, usa, armazena e protege os dados pessoais de condôminos, síndicos e visitantes do site.',
  },
  layout: [
    { blockType: 'legalHero', headline: page.title, updatedText: page.updatedText },
    { blockType: 'richText', legal: true, body: page.body },
  ],
}
