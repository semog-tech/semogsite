import { ImageMedia } from '@/components/Media/ImageMedia'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { SplitHeadline } from '@/motion/SplitHeadline'
import type { HeroBlock as HeroBlockType, Media } from '@/payload-types'

function mediaUrl(resource?: number | Media | null): string | undefined {
  if (!resource || typeof resource === 'number') return undefined
  return resource.url ?? undefined
}

/**
 * Fiel a `.hero`/`.hero-video`/`.hero-layout` de `_reference/index.html`:
 * `Section` full-bleed (padding-block zerado via `!py-0`, já que o próprio
 * ref sobrescreve `section{padding-block:var(--section)}` com uma regra mais
 * específica), vídeo de fundo com `poster`, ou — sem vídeo — a imagem de
 * `poster` via `ImageMedia` cobrindo o fundo. Headline via `SplitHeadline`,
 * CTAs via `Button`.
 */
export function HeroBlock({ eyebrow, headline, subhead, video, poster, ctas }: HeroBlockType) {
  const videoUrl = mediaUrl(video)
  const posterUrl = mediaUrl(poster)
  const posterMedia = poster && typeof poster === 'object' ? poster : undefined

  return (
    <Section className="flex min-h-dvh flex-col overflow-hidden !py-0 bg-navy-950">
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
      <Container className="relative z-[2] flex flex-1 flex-col justify-end pt-[110px] pb-[clamp(3rem,5vw,4.5rem)]">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <SplitHeadline
          as="h1"
          className="mb-[1.4rem] max-w-4xl text-[clamp(2.6rem,6.4vw,5.8rem)] tracking-[-0.04em] [text-shadow:0_2px_40px_rgba(5,8,26,0.45)]"
        >
          {headline}
        </SplitHeadline>
        {subhead && (
          <p className="mb-[1.6rem] max-w-[52ch] text-lead text-silver-100 [text-shadow:0_1px_24px_rgba(5,8,26,0.5)]">
            {subhead}
          </p>
        )}
        {ctas && ctas.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {ctas.map((cta) => (
              <Button
                key={cta.id ?? cta.label}
                href={cta.href}
                variant={cta.variant ?? 'primary'}
                size="lg"
                withArrow
              >
                {cta.label}
              </Button>
            ))}
          </div>
        )}
      </Container>
    </Section>
  )
}
