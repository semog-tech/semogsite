import { ImageMedia } from '@/components/Media/ImageMedia'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/motion/reveal'
import type { Media, TecnologiaRoadmapBlock as TecnologiaRoadmapBlockType } from '@/payload-types'

/**
 * Seção "Tecnologia própria" (Semog One) de `/solucoes`. Redesenhada em torno
 * do card de destaque: `.sec-head` (título + texto) → `.one-card.has-media`
 * (à esquerda: selo `.one-badge`, lockup `.one-logo` com a última palavra em
 * `--grad-ice`, descrição e `.one-tags`; à direita: o dashboard do Semog One
 * em landscape, `.one-media`, mostrado por inteiro) → `.road` (roadmap em
 * `.road-grid`, cards `.road-item` com `.status`/`.live`). CSS em `theme.css`.
 * Seção escura (Section sem `light`).
 *
 * O nome (`intro.name`) tem a última palavra destacada no gradiente ice (ex.:
 * "Semog **One**"), dividindo a string no último espaço.
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

  const nameParts = (intro?.name ?? '').trim().split(/\s+/)
  const nameLast = nameParts.pop() ?? ''
  const nameHead = nameParts.join(' ')

  return (
    <Section className="tech">
      <Container>
        <Reveal className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h2 className="text-h2">{title}</h2>
          {text && <p className="max-w-[58ch] text-lead text-fg-2">{text}</p>}
        </Reveal>

        {intro?.name && (
          <Reveal dir="left" className={`one-card${image ? ' has-media' : ''}`}>
            <div className="one-body">
              {intro.badge && (
                <span className="one-badge">
                  <span className="one-badge-dot" aria-hidden="true" />
                  {intro.badge}
                </span>
              )}
              <div className="one-logo">
                {nameHead && <>{nameHead} </>}
                <span className="one">{nameLast}</span>
              </div>
              <p>{intro.description}</p>
              {intro.tags && intro.tags.length > 0 && (
                <div className="one-tags">
                  {intro.tags.map((tag) => (
                    <span key={tag.id ?? tag.label}>{tag.label}</span>
                  ))}
                </div>
              )}
            </div>
            {image && (
              <div className="one-media">
                <ImageMedia resource={image} fill sizes="(min-width: 900px) 55vw, 100vw" />
              </div>
            )}
          </Reveal>
        )}

        <Reveal dir="right" className="road">
          {roadmapLabel && <div className="road-head">{roadmapLabel}</div>}
          <div className="road-grid">
            {steps.map((step) => (
              <div key={step.id ?? step.title} className="road-item">
                <strong>{step.title}</strong>
                <small>{step.text}</small>
                <span className={`status${step.live ? ' live' : ''}`}>{step.status}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </Section>
  )
}
