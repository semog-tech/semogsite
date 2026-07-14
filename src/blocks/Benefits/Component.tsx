import { ImageMedia } from '@/components/Media/ImageMedia'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { GradientText } from '@/components/ui/GradientText'
import { Section } from '@/components/ui/Section'
import { Stagger } from '@/motion/reveal'
import type { BenefitsBlock as BenefitsBlockType, Media } from '@/payload-types'

type Item = NonNullable<BenefitsBlockType['items']>[number]

/**
 * Título com o trecho final destacado em gradiente (`.gx`), fiel a
 * `<h2>O que muda quando a <span class="gx">Semog assume.</span></h2>`
 * (`_reference/solucoes.html:491`). Sem `titleAccent`, ou se não bater com
 * o fim de `title`, renderiza `title` inteiro sem destaque.
 */
function BentoTitle({ title, accent }: { title: string; accent?: string | null }) {
  if (accent && title.endsWith(accent)) {
    return (
      <h2 className="text-h2">
        {title.slice(0, -accent.length)}
        <GradientText variant="brand">{accent}</GradientText>
      </h2>
    )
  }
  return <h2 className="text-h2">{title}</h2>
}

/**
 * Célula do `.bento` (`_reference/solucoes.html:487-520`, CSS portada em
 * `theme.css`): assume a ordem exata do ref por índice — `c1`/`c3`/`c5`
 * mostram `value` como número gigante (`.num`), `c4` mostra `image` como
 * foto de fundo, `c2` fica só com título/texto sobre o `--grad-band`.
 */
function BentoCell({ item, index }: { item: Item; index: number }) {
  const image = item.image && typeof item.image === 'object' ? (item.image as Media) : undefined
  return (
    <div className={`cell c${(index % 5) + 1}`}>
      {image && (
        <ImageMedia resource={image} fill sizes="(min-width: 1024px) 33vw, 100vw" />
      )}
      {item.value && <span className="num">{item.value}</span>}
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </div>
  )
}

/** Grade numerada de prova social (`.trust-stats`, `/proposta`). */
function GridVariant({ eyebrow, title, items }: BenefitsBlockType) {
  if (!items || items.length === 0) return null
  return (
    <Section light white>
      <Container>
        {(eyebrow || title) && (
          <div className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <h2 className="text-h2">{title}</h2>}
          </div>
        )}
        <Stagger className="grid grid-cols-1 gap-[1.4rem] sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <div key={item.id ?? item.title} className="rounded-card border border-line p-[1.8rem]">
              <span
                aria-hidden="true"
                className="mb-3 block text-[0.82rem] font-semibold text-accent"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="text-[1.15rem]">{item.title}</h3>
              <p className="m-0 text-[0.95rem] text-fg-2">{item.description}</p>
            </div>
          ))}
        </Stagger>
      </Container>
    </Section>
  )
}

/**
 * Bento 5 células (`.benefits.sec-light.white` > `.bento`, fiel a
 * `_reference/solucoes.html:487-520`).
 */
function BentoVariant({ eyebrow, title, titleAccent, items }: BenefitsBlockType) {
  if (!items || items.length === 0) return null
  return (
    <Section light white>
      <Container>
        <div className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          {title && <BentoTitle title={title} accent={titleAccent} />}
        </div>
        <Stagger className="bento">
          {items.map((item, i) => (
            <BentoCell key={item.id ?? item.title} item={item} index={i} />
          ))}
        </Stagger>
      </Container>
    </Section>
  )
}

export function BenefitsBlock(props: BenefitsBlockType) {
  return props.variant === 'bento' ? <BentoVariant {...props} /> : <GridVariant {...props} />
}
