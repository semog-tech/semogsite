import { ImageMedia } from '@/components/Media/ImageMedia'
import { Container } from '@/components/ui/Container'
import { Parallax } from '@/motion/Parallax'
import { Reveal } from '@/motion/reveal'
import { Words } from '@/motion/Words'
import type { HumanQuoteBlock as HumanQuoteBlockType, Media } from '@/payload-types'

/**
 * Fiel à `.human` de `_reference/index.html:747-756`: citação gigante com
 * scrub palavra-a-palavra (`Words`, já injeta o `.sr-only` para leitores de
 * tela) + citação de autor via `Reveal`, e `.human-media` com a foto em
 * `Parallax` (`amount=8`, espelha `data-parallax="8"`). A foto fica 120% mais
 * alta que o contêiner e centralizada (`-inset-y-[10%]`) para o parallax
 * nunca revelar vazio nas bordas — o ref consegue isso com
 * `height:120%` no `<img>` sem posicionamento; aqui o wrapper `Parallax` é
 * quem recebe o sobre-tamanho, já que a `ImageMedia fill` precisa preencher
 * o ancestral posicionado mais próximo. Padding-block próprio (maior que o
 * das seções), por isso `<section>` puro em vez de `Section` (mesmo padrão
 * de `WordsSectionBlock`/`ValuesMarqueeBlock`).
 */
export function HumanQuoteBlock({ quote, author, image, caption }: HumanQuoteBlockType) {
  if (!quote) return null
  const media = image && typeof image === 'object' ? (image as Media) : undefined

  return (
    <section className="human" aria-label="Atendimento humano">
      <Container>
        <Words as="blockquote">{quote}</Words>
        {author && (
          <Reveal as="cite" delay={0.1}>
            {author}
          </Reveal>
        )}
        {media && (
          <div className="human-media">
            <Parallax amount={8} className="absolute -inset-y-[10%] inset-x-0">
              <ImageMedia resource={media} fill className="object-cover" />
            </Parallax>
            {caption && <span className="cap liquid-glass">{caption}</span>}
          </div>
        )}
      </Container>
    </section>
  )
}
