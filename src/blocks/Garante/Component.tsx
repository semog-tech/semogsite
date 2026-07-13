import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Reveal, Stagger } from '@/motion/reveal'
import type { GaranteBlock as GaranteBlockType } from '@/payload-types'

/**
 * Bloco de destaque "Semog Garante", fiel à banda conceitual `.g-band-home`
 * de `_reference/index.html` (aprofundada em `_reference/garante.html`):
 * fundo `--grad-band`, mesmo tratamento do `CTABandBlock` (Task 3b/1), com
 * eyebrow + título + texto de apoio centralizados, a grade de diferenciais
 * ("Como funciona", `.g-step`) entrando via `Stagger`, e CTA opcional com
 * nota de preço (ex.: "1% da arrecadação..."). Sem vídeo/imagem — o
 * `garante.mp4` do ref entra depois, com S3.
 */
export function GaranteBlock({ eyebrow, title, text, features, cta, note }: GaranteBlockType) {
  return (
    <Section className="border-y border-line bg-[image:var(--grad-band)]">
      <Container>
        <div className="mx-auto mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl text-center">
          {eyebrow && <Eyebrow className="mx-auto justify-center">{eyebrow}</Eyebrow>}
          <Reveal as="h2" className="text-h2">
            {title}
          </Reveal>
          {text && (
            <Reveal as="p" delay={0.1} className="mx-auto mt-4 max-w-[46ch] text-fg-2">
              {text}
            </Reveal>
          )}
        </div>

        {features && features.length > 0 && (
          <Stagger className="mb-[clamp(2.5rem,6vw,4.5rem)] grid grid-cols-1 gap-[1.4rem] sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <div
                key={feature.id ?? feature.title}
                className="rounded-card border border-line p-[1.8rem]"
              >
                <span
                  aria-hidden="true"
                  className="mb-3 block text-[0.82rem] font-semibold text-accent"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-[1.15rem]">{feature.title}</h3>
                <p className="m-0 text-[0.95rem] text-fg-2">{feature.description}</p>
              </div>
            ))}
          </Stagger>
        )}

        {(cta?.label || note) && (
          <div className="flex flex-wrap items-center justify-center gap-6">
            {cta?.label && cta?.href && (
              <Button href={cta.href} variant="primary" size="lg" withArrow>
                {cta.label}
              </Button>
            )}
            {note && <p className="m-0 text-[0.9rem] text-fg-3">{note}</p>}
          </div>
        )}
      </Container>
    </Section>
  )
}
