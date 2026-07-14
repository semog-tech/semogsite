import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { GradientText } from '@/components/ui/GradientText'
import { Section } from '@/components/ui/Section'
import { Reveal, Stagger } from '@/motion/reveal'
import type { FeatureGridBlock as FeatureGridBlockType } from '@/payload-types'

type Feature = NonNullable<FeatureGridBlockType['features']>[number]

/**
 * Título com o trecho final destacado em gradiente — `.gx` (claro) ou
 * `.gx-ice` (escuro), mesmo padrão de `Benefits`'s `BentoTitle`. Sem
 * `accent`, ou se não bater com o fim de `title`, renderiza `title` inteiro
 * sem destaque.
 */
function GridTitle({
  title,
  accent,
  variant,
}: {
  title: string
  accent?: string | null
  variant: 'light' | 'dark'
}) {
  if (accent && title.endsWith(accent)) {
    return (
      <h2 className="text-h2">
        {title.slice(0, -accent.length)}
        <GradientText variant={variant === 'light' ? 'brand' : 'ice'}>{accent}</GradientText>
      </h2>
    )
  }
  return <h2 className="text-h2">{title}</h2>
}

/**
 * `.svc-card` de `_reference/administracao-de-condominios.html:91-105`:
 * card branco (não o branco automático de `.sec-light .why-card` —
 * sombra/borda próprias) com badge `.ic` (gradiente da marca) + SVG inline.
 */
function LightCard({ feature }: { feature: Feature }) {
  return (
    <div className="h-full rounded-card border border-[rgba(16,26,72,0.08)] bg-white p-[1.9rem] shadow-[0_18px_45px_-26px_rgba(16,26,72,0.22)] transition-[transform,box-shadow] duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[6px] hover:shadow-[0_26px_60px_-26px_rgba(16,26,72,0.3)]">
      {feature.iconSvg && (
        <span
          aria-hidden="true"
          className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-[linear-gradient(135deg,#1B2D70,#3B54BE)]"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: markup vem do CMS (seed/admin Payload), não de input de usuário final
            dangerouslySetInnerHTML={{ __html: feature.iconSvg }}
          />
        </span>
      )}
      <h3 className="mt-4 mb-[0.4rem] text-[1.25rem]">{feature.title}</h3>
      <p className="m-0 text-[0.92rem] text-fg-2">{feature.description}</p>
    </div>
  )
}

/** `.why-card` de `_reference/incorporadoras.html`: card ice-tint sobre navy. */
function DarkCard({ feature }: { feature: Feature }) {
  return (
    <div className="h-full rounded-card border border-line bg-[linear-gradient(180deg,rgba(173,213,235,0.045),rgba(173,213,235,0.01))] p-[2.2rem] transition-[transform,border-color] duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[5px] hover:border-line-strong">
      {feature.icon && (
        <span
          aria-hidden="true"
          className="mb-[1.4rem] inline-flex h-12 w-12 items-center justify-center rounded-pill border border-line-strong text-lg text-accent"
        >
          {feature.icon}
        </span>
      )}
      <h3 className="text-[1.3rem]">{feature.title}</h3>
      <p className="m-0 text-[0.98rem] text-fg-2">{feature.description}</p>
    </div>
  )
}

/**
 * Grid de cards, duas variantes (`variant`, default `dark`):
 *
 * - `dark` — fiel ao padrão `.why-card` de `_reference/incorporadoras.html`,
 *   cada card entra via `Reveal` individual (comportamento inalterado).
 * - `light` — fiel a `.svc.sec-light` > `.svc-grid` de
 *   `_reference/administracao-de-condominios.html:230-286`: `Section light`
 *   (sem `white` — o ref não usa `.white` nesta seção) e a grade inteira
 *   entra via `Stagger` (`data-stagger` no ref, não reveals individuais).
 *
 * Cabeçalho (`eyebrow`+`title`) entra via `Reveal`, fiel aos `data-reveal`
 * de `.frame-head`/`.sec-head` do ref (o header antes não tinha reveal
 * algum — motion adicionada nesta revisão, vale para as duas variantes).
 */
export function FeatureGridBlock({
  variant,
  eyebrow,
  title,
  titleAccent,
  features,
}: FeatureGridBlockType) {
  if (!features || features.length === 0) return null
  const isLight = variant === 'light'

  return (
    <Section light={isLight}>
      <Container>
        {(eyebrow || title) && (
          <Reveal className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && (
              <GridTitle title={title} accent={titleAccent} variant={isLight ? 'light' : 'dark'} />
            )}
          </Reveal>
        )}
        {isLight ? (
          <Stagger className="grid grid-cols-1 gap-[1.4rem] sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <LightCard key={feature.id ?? feature.title} feature={feature} />
            ))}
          </Stagger>
        ) : (
          <div className="grid grid-cols-1 gap-[1.4rem] sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <Reveal key={feature.id ?? feature.title} delay={i * 0.06}>
                <DarkCard feature={feature} />
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </Section>
  )
}
