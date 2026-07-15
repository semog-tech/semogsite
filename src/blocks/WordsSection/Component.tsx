import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/motion/reveal'
import { Words } from '@/motion/Words'
import type { WordsSectionBlock as WordsSectionBlockType } from '@/payload-types'

const SECTION_CLASS = {
  manifesto: 'manifesto',
  problem: 'g-problem',
  argument: 'argument',
} as const

/**
 * Fiel à `.manifesto` de `_reference/index.html:551-555`: seção com o
 * parágrafo grande (tipografia display via `.manifesto p` em theme.css)
 * revelado palavra a palavra por `Words` (`src/motion/Words.tsx` —
 * scrub palavra-a-palavra no scroll, com fallback reduced-motion). O `Words`
 * já injeta um `.sr-only` com o texto completo para leitores de tela.
 *
 * `variant: 'problem'` troca `.manifesto` por `.g-problem` — ver doc do
 * campo em `WordsSection/config.ts`.
 *
 * `variant: 'argument'` troca `.manifesto` por `.argument` e renderiza um 2º
 * parágrafo (`sub`, via `Reveal` simples — sem scrub) abaixo do `Words`.
 * Como a seção passa a ter 2 `<p>`, cada um recebe sua própria classe
 * (`.big`/`.sub`) em vez do seletor de tag `p` usado pelas outras variantes.
 *
 * `.big` também entra no `variant: 'manifesto'` quando `text` traz `<em>`
 * embutido: fiel a `.manifesto .big` de `_reference/semog.html:76-83`
 * (distinto de `.manifesto p`, sem `<em>`, de `_reference/index.html:162-167`
 * — mesmo variant do CMS, dois markups diferentes no ref, diferenciados só
 * pela presença do destaque). Sem `<em>`, o parágrafo continua saindo como
 * `p` solto, igual a antes.
 */
export function WordsSectionBlock({ eyebrow, text, sub, variant }: WordsSectionBlockType) {
  if (!text) return null
  const isArgument = variant === 'argument'
  const hasEmphasis = /<em>/.test(text)
  const big = isArgument || ((variant ?? 'manifesto') === 'manifesto' && hasEmphasis)

  return (
    <section className={SECTION_CLASS[variant ?? 'manifesto']}>
      <Container>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <Words className={big ? 'big' : undefined}>{text}</Words>
        {isArgument && sub && (
          <Reveal as="p" className="sub">
            {sub}
          </Reveal>
        )}
      </Container>
    </section>
  )
}
