import { ImageMedia } from '@/components/Media/ImageMedia'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/motion/reveal'
import type { Media, TecnologiaRoadmapBlock as TecnologiaRoadmapBlockType } from '@/payload-types'

/**
 * Fiel a `#tecnologia` de `_reference/solucoes.html:645-691`: `.sec-head`
 * + `.tech-grid` (`.one-card` `data-reveal="left"` | `.road`
 * `data-reveal="right"`). CSS portada em `theme.css` (`.tech-grid`,
 * `.one-card`, `.one-tags`, `.road*`, `.status.live`).
 *
 * `.one-card` ganha um slot de imagem opcional (`intro.image`, ver
 * `config.ts`): sem mídia, fica igual ao ref (texto + tags empilhados,
 * `.has-media` ausente); com mídia, vira split interno imagem/texto via
 * `.one-card.has-media`.
 */
export function TecnologiaRoadmapBlock({
  eyebrow,
  title,
  text,
  intro,
  roadmapLabel,
  steps,
}: TecnologiaRoadmapBlockType) {
  if (!steps || steps.length === 0) return null
  const image = intro?.image && typeof intro.image === 'object' ? (intro.image as Media) : undefined

  return (
    <Section className="tech">
      <Container>
        <Reveal className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h2 className="text-h2">{title}</h2>
          {text && <p className="max-w-[58ch] text-lead text-fg-2">{text}</p>}
        </Reveal>

        <div className="tech-grid">
          {intro?.name && (
            <Reveal dir="left" className={`one-card${image ? ' has-media' : ''}`}>
              {image && (
                <div className="one-media">
                  <ImageMedia resource={image} fill sizes="(min-width: 1024px) 30vw, 100vw" />
                </div>
              )}
              <div className="one-body">
                <div>
                  <div className="one-logo">{intro.name}</div>
                  <p className="mt-4">{intro.description}</p>
                </div>
                {intro.tags && intro.tags.length > 0 && (
                  <div className="one-tags">
                    {intro.tags.map((tag) => (
                      <span key={tag.id ?? tag.label}>{tag.label}</span>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          )}

          <Reveal dir="right" className="road">
            {roadmapLabel && <div className="road-head">{roadmapLabel}</div>}
            {steps.map((step) => (
              <div key={step.id ?? step.title} className="road-item">
                <div>
                  <strong>{step.title}</strong>
                  <small>{step.text}</small>
                </div>
                <span className={`status${step.live ? ' live' : ''}`}>{step.status}</span>
              </div>
            ))}
          </Reveal>
        </div>
      </Container>
    </Section>
  )
}
