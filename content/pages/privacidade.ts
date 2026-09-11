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
    // Onde o visitante desliga análise/marketing e muda de ideia depois. Fica
    // DEPOIS do texto da política de propósito: o texto explica o que é
    // coletado e com que base legal, e o controle é a consequência prática
    // disso. Âncora `#cookies` — é para lá que o corpo da política aponta.
    {
      blockType: 'cookiePreferences',
      title: 'Suas preferências de cookies',
      description:
        'Você pode desligar as categorias não essenciais a qualquer momento, e voltar aqui para mudar de ideia. A escolha fica guardada neste navegador por 180 dias.',
    },
  ],
}
