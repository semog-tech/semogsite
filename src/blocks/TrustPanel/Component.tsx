import { ImageMedia } from '@/components/Media/ImageMedia'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/motion/reveal'
import type { Media, TrustPanelBlock as TrustPanelBlockType } from '@/payload-types'

/** `.trust-quote em` — cor sólida `--ice-400`, sem itálico (não é `.gx`/`.gx-ice`, ver `theme.css`). */
function Quote({ quote, accent }: { quote: string; accent?: string | null }) {
  if (accent && quote.endsWith(accent)) {
    return (
      <p className="trust-quote">
        {quote.slice(0, -accent.length)}
        <em>{accent}</em>
      </p>
    )
  }
  return <p className="trust-quote">{quote}</p>
}

/**
 * Painel de confiança (`.trust-panel` > 3 `.trust-card`), fiel a
 * `_reference/proposta.html:260-290` — ver o comentário completo (var→token
 * + deviação do grid 2-colunas) em `theme.css` (`.trust-panel`/
 * `.trust-panel-band`/`.trust-card`) e em `TrustPanel/config.ts`. Cada
 * cartão entra num `Reveal` próprio, fiel ao único `data-reveal="right"` do
 * `<aside>` no ref (aqui distribuído por cartão, já que os 3 não vivem mais
 * dentro do mesmo `<aside>`).
 */
export function TrustPanelBlock({
  photo,
  stats,
  quote,
  quoteAccent,
  quoteText,
  whatsappTitle,
  whatsappText,
  whatsapp,
  whatsappDisplay,
}: TrustPanelBlockType) {
  const photoMedia = photo && typeof photo === 'object' ? (photo as Media) : undefined

  return (
    <Section>
      <Container>
        <div className="trust-panel-band">
          {stats && stats.length > 0 && (
            <Reveal dir="right" className="trust-card hero-card">
              {photoMedia && (
                <ImageMedia
                  resource={photoMedia}
                  fill
                  className="absolute inset-0 z-0 object-cover"
                  sizes="(min-width: 1024px) 33vw, 100vw"
                />
              )}
              <div
                aria-hidden="true"
                className="absolute inset-0 z-0"
                style={{ background: 'rgba(5,8,26,0.72)' }}
              />
              <div className="trust-stats">
                {stats.map((stat) => (
                  <div key={stat.id ?? stat.label}>
                    <div className="whitespace-nowrap font-display text-[2rem] leading-none font-medium tracking-[-0.04em] text-fg">
                      {stat.value}
                    </div>
                    <p className="mt-[0.2rem] text-[0.85rem] text-fg-2">{stat.label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          )}

          <Reveal dir="right" delay={0.1} className="trust-card">
            <Quote quote={quote} accent={quoteAccent} />
            <p>{quoteText}</p>
          </Reveal>

          <Reveal dir="right" delay={0.2} className="trust-card">
            <h3>{whatsappTitle}</h3>
            <p>
              {whatsappText}{' '}
              <a href={`https://wa.me/${whatsapp}`} className="font-semibold text-ice-300">
                {whatsappDisplay}
              </a>
            </p>
          </Reveal>
        </div>
      </Container>
    </Section>
  )
}
