import { ImageMedia } from '@/components/Media/ImageMedia'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Reveal, Stagger } from '@/motion/reveal'
import type { GaranteBlock as GaranteBlockType, Media } from '@/payload-types'

function mediaUrl(resource?: number | Media | null): string | undefined {
  if (!resource || typeof resource === 'number') return undefined
  return resource.url ?? undefined
}

/**
 * Bloco de destaque "Semog Garante". Três usos, escolhidos pela presença de
 * `video`/`poster`/`pct`:
 *
 * 1. **Banda com vídeo** (home) — fiel a `.g-band-home` de
 *    `_reference/index.html:678-698`: `<section>` puro (não `Section`, que
 *    força `py-*` — mesmo padrão de `HumanQuoteBlock`) full-bleed com vídeo
 *    de fundo (ou `poster` como imagem, sem vídeo), overlay em gradiente
 *    (`::after` portado pra `theme.css`), eyebrow como `.tag`, título, texto
 *    opcional, e uma `.row` com o CTA (branco, magnético, como no ref) +
 *    `priceChip` em chip de vidro (`.pct-chip liquid-glass`).
 * 2. **Banda split `.g-band`** (sem `video`/`poster`, com `pct`) — fiel às
 *    landings de cidade (ex.:
 *    `_reference/administradora-de-condominios-recife.html:176-190,382-402`):
 *    `Section` escura (o ref não usa `.sec-light` aqui) com fundo radial +
 *    `--grad-band` via `style`, `.wrap` de 2 colunas — h2+p+CTA à esquerda
 *    (`dir="left"`), `pct` tipográfico gigante à direita (`dir="right"`).
 * 3. **Banda `--grad-band` + steps** (demais páginas, ex. `/garante`, sem
 *    `pct`) — fundo `--grad-band`, eyebrow + título + texto centralizados,
 *    grade de diferenciais ("Como funciona", `.g-step`) via `Stagger`, CTA +
 *    nota de preço. Comportamento inalterado desde a Task 3b/1.
 */
export function GaranteBlock({
  eyebrow,
  title,
  text,
  video,
  poster,
  features,
  cta,
  note,
  priceChip,
  pct,
}: GaranteBlockType) {
  const videoUrl = mediaUrl(video)
  const posterUrl = mediaUrl(poster)
  const posterMedia = poster && typeof poster === 'object' ? poster : undefined

  if (!videoUrl && !posterMedia && pct?.value) {
    return (
      <Section
        className="g-band border-y border-line"
        style={{
          background:
            'radial-gradient(70% 90% at 85% 20%, rgba(173,213,235,0.14) 0%, transparent 55%), var(--grad-band)',
        }}
      >
        <Container>
          <div className="wrap">
            <Reveal dir="left">
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              <h2>{title}</h2>
              {text && <p>{text}</p>}
              {cta?.label && cta?.href && (
                <div className="mt-[1.8rem]">
                  <Button href={cta.href} variant="primary" withArrow magnetic>
                    {cta.label}
                  </Button>
                </div>
              )}
            </Reveal>
            <Reveal dir="right">
              <span className="pct gx-ice">{pct.value}</span>
              {pct.label && <p className="pct-l">{pct.label}</p>}
            </Reveal>
          </div>
        </Container>
      </Section>
    )
  }

  if (videoUrl || posterMedia) {
    return (
      <section className="g-band-home" aria-label="Semog Garante">
        {videoUrl ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={posterUrl}
            className="absolute inset-0 z-[1] h-full w-full object-cover"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : (
          posterMedia && (
            <ImageMedia
              resource={posterMedia}
              fill
              priority
              className="absolute inset-0 z-[1] object-cover"
            />
          )
        )}
        <Container className="relative z-[3]">
          {eyebrow && (
            <Reveal as="span" className="tag">
              {eyebrow}
            </Reveal>
          )}
          <Reveal as="h2">{title}</Reveal>
          {text && (
            <Reveal as="p" delay={0.05} className="mb-6 max-w-[46ch] text-fg-2">
              {text}
            </Reveal>
          )}
          {(cta?.label || priceChip?.value) && (
            <div className="row">
              {cta?.label && cta?.href && (
                <Reveal delay={0.1}>
                  <Button href={cta.href} variant="white" size="lg" withArrow magnetic>
                    {cta.label}
                  </Button>
                </Reveal>
              )}
              {priceChip?.value && (
                <Reveal delay={0.2} className="pct-chip liquid-glass">
                  <span className="n gx-ice">{priceChip.value}</span>
                  {priceChip.label && <small>{priceChip.label}</small>}
                </Reveal>
              )}
            </div>
          )}
        </Container>
      </section>
    )
  }

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
