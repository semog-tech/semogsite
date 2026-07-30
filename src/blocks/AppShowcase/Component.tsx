import { ImageMedia } from '@/components/Media/ImageMedia'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { StoreBadges } from '@/components/ui/StoreBadges'
import { Reveal, Stagger } from '@/motion/reveal'
import type { AppShowcaseBlock as AppShowcaseBlockType } from '@/types/blocks'
import type { Media } from '@/types/media'

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
 *
 * Task 5 (Plano 2) — variante usada na home, sem quebrar `/solucoes`:
 * - `theme='deep'` troca `sec-light` por `bg-navy-950`; o default
 *   (`theme` ausente ou `'light'`) preserva `sec-light`, então qualquer
 *   instância já salva no banco (sem o campo) continua igual.
 * - `imageSecondary` é só um "extra": sem ele, a coluna de mídia mantém
 *   EXATAMENTE o markup original (`max-w-[400px]` + `rounded-card
 *   border-line shadow-card`, uma única imagem) — é o que `/solucoes`
 *   usa hoje. Só quando as duas imagens existem é que a mídia vira
 *   `.app-screens` (duas telas sobrepostas, ver `theme.css`).
 * - `rating`/`stores` são blocos totalmente opcionais entre a grade de
 *   features e o CTA; sem eles, nada é renderizado (nem os wrappers
 *   `.app-rating`/`.store-badges`), preservando o layout de `/solucoes`.
 */
export function AppShowcaseBlock({
  eyebrow,
  title,
  text,
  image,
  imageSecondary,
  theme,
  rating,
  stores,
  features,
  cta,
  anchor,
}: AppShowcaseBlockType) {
  const media = image && typeof image === 'object' ? (image as Media) : undefined
  const secondary =
    imageSecondary && typeof imageSecondary === 'object' ? (imageSecondary as Media) : undefined

  return (
    <Section
      id={anchor ?? undefined}
      light={theme !== 'deep'}
      className={theme === 'deep' ? 'bg-navy-950' : undefined}
    >
      <Container
        className={
          media
            ? 'grid grid-cols-1 items-center gap-[clamp(2.5rem,6vw,5rem)] lg:grid-cols-[0.85fr_1.15fr]'
            : undefined
        }
      >
        {media &&
          (secondary ? (
            <Reveal dir="left" className="app-screens">
              <div className="app-screen app-screen-back">
                <ImageMedia resource={secondary} sizes="(max-width: 900px) 40vw, 240px" />
              </div>
              <div className="app-screen app-screen-front">
                <ImageMedia resource={media} sizes="(max-width: 900px) 45vw, 260px" />
              </div>
            </Reveal>
          ) : (
            <Reveal
              dir="left"
              className="w-full max-w-[400px] justify-self-center overflow-hidden rounded-card border border-line shadow-card"
            >
              <ImageMedia resource={media} sizes="(min-width: 400px) 400px, 100vw" />
            </Reveal>
          ))}

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

          {rating?.score && (
            <div className="app-rating liquid-glass">
              <span className="app-rating-n">{rating.score}</span>
              <span className="app-rating-meta">
                <span className="app-rating-stars" aria-hidden="true">
                  ★★★★★
                </span>
                {rating.label && <span>{rating.label}</span>}
              </span>
            </div>
          )}
          <StoreBadges appStore={stores?.appStore} playStore={stores?.playStore} />

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
