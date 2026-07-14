import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Words } from '@/motion/Words'
import type { WordsSectionBlock as WordsSectionBlockType } from '@/payload-types'

/**
 * Fiel à `.manifesto` de `_reference/index.html:551-555`: seção com o
 * parágrafo grande (tipografia display via `.manifesto p` em theme.css)
 * revelado palavra a palavra por `Words` (`src/motion/Words.tsx` —
 * scrub palavra-a-palavra no scroll, com fallback reduced-motion). O `Words`
 * já injeta um `.sr-only` com o texto completo para leitores de tela.
 *
 * `variant: 'problem'` troca `.manifesto` por `.g-problem` — ver doc do
 * campo em `WordsSection/config.ts`.
 */
export function WordsSectionBlock({ eyebrow, text, variant }: WordsSectionBlockType) {
  if (!text) return null

  return (
    <section className={variant === 'problem' ? 'g-problem' : 'manifesto'}>
      <Container>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <Words>{text}</Words>
      </Container>
    </section>
  )
}
