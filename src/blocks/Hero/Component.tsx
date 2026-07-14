import { ImageMedia } from '@/components/Media/ImageMedia'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Chars } from '@/motion/Chars'
import { Fade } from '@/motion/Fade'
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
 * `poster` via `ImageMedia` cobrindo o fundo. Headline por caractere via
 * `Chars` (`data-chars`, semog.js:49-87); eyebrow/lead/CTAs entram com fade
 * escalonado via `Fade` (`data-fade` + `data-fade-delay`, semog.js:88-93 —
 * lead 800ms, CTAs 1200ms como no ref `_reference/index.html:494-503`). CTAs
 * via `Button` (primary já é magnético).
 *
 * Quando `tag` está preenchido, lead+CTAs entram na coluna esquerda de um
 * `.hero-grid` de 2 colunas e a coluna direita (`.hero-tagcol`) recebe o chip
 * de vidro `.hero-tagbox` (fade 1400ms, como `_reference/index.html:505-506`).
 * Sem `tag`, o layout permanece de 1 coluna (comportamento anterior).
 *
 * `pageHeroOverlay` (sem efeito com `video`) troca o tratamento acima pelo
 * `.page-hero`/`.page-hero .bg`/`.page-hero::after` de
 * `_reference/solucoes.html:87-107`: 74dvh em vez de 100dvh, `poster` a
 * 0.5 de opacidade e recortado em `center 65%`, e um gradiente escuro por
 * cima (`rgba(5,8,26,.55)` → `rgba(10,16,46,.3)` → `--color-navy-900`
 * opaco) para dar contraste ao texto — verbatim do ref, sem overlay algum
 * o fundo ficava claro demais. Ver a doc do campo em `Hero/config.ts` para
 * o porquê dos valores serem fixos (específicos de `/solucoes`).
 */
export function HeroBlock({
  eyebrow,
  headline,
  subhead,
  tag,
  video,
  poster,
  pageHeroOverlay,
  ctas,
}: HeroBlockType) {
  const videoUrl = mediaUrl(video)
  const posterUrl = mediaUrl(poster)
  const posterMedia = poster && typeof poster === 'object' ? poster : undefined
  const isPageHero = !videoUrl && !!pageHeroOverlay && !!posterMedia

  const subheadAndCtas = (
    <>
      {subhead && (
        <Fade
          as="p"
          delay={800}
          className="mb-[1.6rem] max-w-[52ch] text-lead text-silver-100 [text-shadow:0_1px_24px_rgba(5,8,26,0.5)]"
        >
          {subhead}
        </Fade>
      )}
      {ctas && ctas.length > 0 && (
        <Fade delay={1200} className="flex flex-wrap gap-4">
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
        </Fade>
      )}
    </>
  )

  return (
    <Section
      className={
        isPageHero
          ? 'flex min-h-[74dvh] flex-col overflow-hidden !py-0 bg-navy-950'
          : 'flex min-h-dvh flex-col overflow-hidden !py-0 bg-navy-950'
      }
    >
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
            className={
              isPageHero
                ? 'absolute inset-0 z-[1] object-cover object-[center_65%] opacity-50'
                : 'absolute inset-0 z-[1] object-cover'
            }
          />
        )
      )}
      {isPageHero && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[2] bg-[linear-gradient(180deg,rgba(5,8,26,0.55)_0%,rgba(10,16,46,0.3)_50%,var(--color-navy-900)_100%)]"
        />
      )}
      <Container
        className={
          isPageHero
            ? 'relative z-[3] flex flex-1 flex-col justify-end pt-[110px] pb-[clamp(3rem,6vw,4.5rem)]'
            : 'relative z-[3] flex flex-1 flex-col justify-end pt-[110px] pb-[clamp(3rem,5vw,4.5rem)]'
        }
      >
        {eyebrow && (
          <Fade delay={600}>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Fade>
        )}
        <Chars
          as="h1"
          className="mb-[1.4rem] max-w-4xl text-[clamp(2.6rem,6.4vw,5.8rem)] tracking-[-0.04em] [text-shadow:0_2px_40px_rgba(5,8,26,0.45)]"
        >
          {headline}
        </Chars>
        {tag ? (
          <div className="hero-grid">
            <div>{subheadAndCtas}</div>
            <div className="hero-tagcol">
              <Fade delay={1400} duration={1000}>
                <div className="hero-tagbox liquid-glass">{tag}</div>
              </Fade>
            </div>
          </div>
        ) : (
          subheadAndCtas
        )}
      </Container>
    </Section>
  )
}
