import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/motion/reveal'
import type { FeatureGridBlock as FeatureGridBlockType } from '@/payload-types'

/**
 * Grid de cards fiel ao padrão `.why-card` de `_reference/incorporadoras.html`:
 * glifo/ícone opcional em badge circular (`rounded-pill`), título e
 * descrição, sobre os tokens de superfície (`rounded-card border border-line`)
 * já usados no styleguide (Task 2). Cada card entra via `Reveal`.
 */
export function FeatureGridBlock({ eyebrow, title, features }: FeatureGridBlockType) {
  if (!features || features.length === 0) return null

  return (
    <Section>
      <Container>
        {(eyebrow || title) && (
          <div className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <h2 className="text-h2">{title}</h2>}
          </div>
        )}
        <div className="grid grid-cols-1 gap-[1.4rem] sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Reveal key={feature.id ?? feature.title} delay={i * 0.06}>
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
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  )
}
