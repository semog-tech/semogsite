import { ImageMedia } from '@/components/Media/ImageMedia'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { StoreBadges } from '@/components/ui/StoreBadges'
import { Reveal } from '@/motion/reveal'
import type { AppHeroBlock as AppHeroBlockType } from '@/types/blocks'
import type { Media } from '@/types/media'

/**
 * Hero da página `/aplicativo`: texto e prova à esquerda, telas do produto à
 * direita. `<section>` puro (não `Section`, que força `py-*`) pelo mesmo
 * motivo do `Hero` e do `HumanQuote` — o padding aqui é próprio, pra caber a
 * nav de vidro por cima (`.app-hero` em `theme.css`).
 *
 * Sem vídeo de propósito: a página é sobre o app, e as telas reais do
 * produto já provam o que o hero promete, sem carregar mídia decorativa.
 * A nota das lojas fica acima dos selos — quem chega procurando o app quer
 * saber se vale a pena antes de decidir baixar.
 *
 * `.app-screens`/`.app-screen`/`.app-rating`/`.store-badges` já existem em
 * `theme.css` (Task 5 do plano 02, usadas por `AppShowcase`) — este bloco só
 * reusa, sem duplicar CSS.
 */
export function AppHeroBlock({
  eyebrow,
  headline,
  lead,
  rating,
  stores,
  footnote,
  screens,
}: AppHeroBlockType) {
  const images = (screens ?? [])
    .map((s) => (s.image && typeof s.image === 'object' ? (s.image as Media) : undefined))
    .filter((m): m is Media => Boolean(m))

  return (
    <section className="app-hero">
      <Container className="app-hero-grid">
        <div>
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h1>{headline}</h1>
          {lead && (
            <Reveal as="p" delay={0.1} className="app-hero-lead">
              {lead}
            </Reveal>
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
          {footnote && <p className="app-hero-footnote">{footnote}</p>}
        </div>
        {images.length > 0 && (
          <Reveal dir="left" className="app-screens">
            {images[1] && (
              <div className="app-screen app-screen-back">
                <ImageMedia resource={images[1]} sizes="(max-width: 900px) 40vw, 240px" />
              </div>
            )}
            <div className="app-screen app-screen-front">
              <ImageMedia resource={images[0]} priority sizes="(max-width: 900px) 45vw, 260px" />
            </div>
          </Reveal>
        )}
      </Container>
    </section>
  )
}
