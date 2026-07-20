import { ImageMedia } from '@/components/Media/ImageMedia'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Reveal, Stagger } from '@/motion/reveal'
import type { AppShowcaseBlock as AppShowcaseBlockType, Media } from '@/payload-types'

/**
 * Seção do aplicativo, fiel a `.app-band`/`.app-grid`/`.app-media`/
 * `.app-feats` de `_reference/solucoes.html:618-642`: à esquerda, o print
 * do app (`.app-media` — `max-width:400px`, centralizado, `rounded-card`/
 * `border-line`/`shadow-card`; sem `object-fit` forçado, já que o ref não
 * recorta a imagem, só limita a largura — o `<img>` mantém a proporção
 * natural via o reset global `img{max-width:100%}`, `src/styles/theme.css`);
 * à direita, eyebrow + título + texto de apoio + grade 2 colunas de
 * features com borda superior (`.app-feats div`), e CTA opcional. Sem
 * `image` (bloco reutilizável pelo admin em qualquer página), a coluna de
 * mídia some e o texto ocupa a largura toda — mesmo padrão de `MediaCol`
 * em `SolutionSplit/Component.tsx`. Seção clara (`sec-light`), fiel ao
 * `.app-band.sec-light` do ref.
 */
export function AppShowcaseBlock({
  eyebrow,
  title,
  text,
  image,
  features,
  cta,
}: AppShowcaseBlockType) {
  const media = image && typeof image === 'object' ? (image as Media) : undefined

  return (
    <Section light>
      <Container
        className={
          media
            ? 'grid grid-cols-1 items-center gap-[clamp(2.5rem,6vw,5rem)] lg:grid-cols-[0.85fr_1.15fr]'
            : undefined
        }
      >
        {media && (
          <Reveal
            dir="left"
            className="w-full max-w-[400px] justify-self-center overflow-hidden rounded-card border border-line shadow-card"
          >
            <ImageMedia resource={media} sizes="(min-width: 400px) 400px, 100vw" />
          </Reveal>
        )}

        <div>
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <Reveal as="h2" delay={0.1} className="text-h2">
            {title}
          </Reveal>
          {text && (
            <Reveal as="p" delay={0.16} className="mt-4 max-w-[52ch] text-fg-2">
              {text}
            </Reveal>
          )}

          {features && features.length > 0 && (
            <Stagger className="mt-[1.8rem] grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.id ?? feature.title} className="border-t border-line pt-4">
                  <strong className="block text-[1rem] text-fg">{feature.title}</strong>
                  <span className="text-[0.88rem] text-fg-2">{feature.description}</span>
                </div>
              ))}
            </Stagger>
          )}

          {cta?.label && cta?.href && (
            <Button href={cta.href} variant="primary" size="lg" withArrow className="mt-[2rem]">
              {cta.label}
            </Button>
          )}
        </div>
      </Container>
    </Section>
  )
}
