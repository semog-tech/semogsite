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
 * `priceChip` (só com `video`) reproduz o hero `.g-hero`/`.g-price` de
 * `_reference/garante.html:59-104` (estilo inline da própria página): liga a
 * classe `g-hero` (overlay `::after` em gradiente, distinto do `.hero` sem
 * overlay da home) e troca subhead/CTAs para dentro de uma `.row` — docked à
 * esquerda — ao lado do chip de vidro `.g-price` (valor em `--grad-ice` +
 * legenda), docked à direita. Também troca o `h1` para o clamp maior de
 * `.g-hero h1` (`clamp(3rem,8.5vw,7.5rem)`, `max-width:12ch`,
 * `letter-spacing:-0.02em`) — bem maior que o `.hero h1` genérico da home
 * (`clamp(2.6rem,6.4vw,5.8rem)`), por isso quebra em 2 linhas num headline
 * curto como "Inadimplência zero.". Sem `priceChip`, o hero de vídeo mantém
 * o comportamento anterior (subhead/CTAs empilhados, sem overlay, `h1`
 * genérico).
 *
 * `pageHeroOverlay` (sem efeito com `video`) troca o tratamento acima pelo
 * `.page-hero`/`.page-hero .bg`/`.page-hero::after` do ref (ex.:
 * `_reference/solucoes.html:87-107`, `_reference/administracao-de-
 * condominios.html:61-77`): altura reduzida em vez de 100dvh, `poster` com
 * opacidade e recorte próprios, e um gradiente escuro por cima para dar
 * contraste ao texto — cada página tem seus próprios números (ver
 * `pageHeroMinHeight`/`pageHeroPosterOpacity`/`pageHeroBgPosition`/
 * `pageHeroGradient`, documentados em `Hero/config.ts`), aplicados via
 * `style` (não dá pra gerar classe Tailwind estática a partir de valor
 * dinâmico do CMS). Sem `poster` (ex.: `_reference/blog.html:37-46`,
 * `_reference/contato.html:77-87` — `.page-hero` lá é só gradiente, sem
 * `.bg`/imagem nenhuma), `hasPosterImage` fica `false`: nem `<ImageMedia>`
 * nem o `div` de overlay são renderizados, e `pageHeroGradient` vira
 * diretamente o `background` do próprio `Section` (o gradiente É o fundo,
 * não uma camada por cima de foto). `pageHeroPaddingBottom` reproduz o 2º
 * valor de `padding-block` do `.page-hero` (varia por página);
 * `pageHeroHeadlineMaxWidth` reproduz `.page-hero h1{max-width}` — ambos
 * opcionais, sem efeito fora de `pageHeroOverlay`.
 */
export function HeroBlock({
  eyebrow,
  headline,
  subhead,
  tag,
  video,
  poster,
  pageHeroOverlay,
  pageHeroMinHeight,
  pageHeroPosterOpacity,
  pageHeroBgPosition,
  pageHeroGradient,
  pageHeroPaddingBottom,
  pageHeroHeadlineMaxWidth,
  ctas,
  priceChip,
}: HeroBlockType) {
  const videoUrl = mediaUrl(video)
  const posterUrl = mediaUrl(poster)
  const posterMedia = poster && typeof poster === 'object' ? poster : undefined
  const isPageHero = !videoUrl && !!pageHeroOverlay
  // Sem `poster`, não há imagem/overlay pra desenhar — `.page-hero` fiel a
  // `_reference/blog.html:37-46`/`_reference/contato.html:77-87` é só um
  // gradiente puro (`pageHeroGradient` vira o `background` do próprio
  // `Section`, não um `::after` por cima de imagem).
  const hasPosterImage = isPageHero && !!posterMedia
  const minHeight = pageHeroMinHeight || '74dvh'
  const posterOpacity = pageHeroPosterOpacity ?? 0.5
  const bgPosition = pageHeroBgPosition || 'center 65%'
  const gradient =
    pageHeroGradient ||
    'linear-gradient(180deg, rgba(5,8,26,0.55) 0%, rgba(10,16,46,0.3) 50%, var(--color-navy-900) 100%)'
  const paddingBottom = pageHeroPaddingBottom || 'clamp(3rem, 6vw, 4.5rem)'

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

  const hasPriceChip = !!videoUrl && !!priceChip?.value

  return (
    <Section
      className={`flex flex-col overflow-hidden !py-0 bg-navy-950 ${hasPriceChip ? 'g-hero' : ''}`}
      style={
        isPageHero
          ? { minHeight, ...(hasPosterImage ? {} : { background: gradient }) }
          : { minHeight: '100dvh' }
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
        hasPosterImage &&
        posterMedia && (
          <ImageMedia
            resource={posterMedia}
            fill
            priority
            className="absolute inset-0 z-[1] object-cover"
            style={{ objectPosition: bgPosition, opacity: posterOpacity }}
          />
        )
      )}
      {hasPosterImage && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[2]"
          style={{ background: gradient }}
        />
      )}
      <Container
        className={`relative z-[3] flex flex-1 flex-col justify-end pt-[110px] ${
          isPageHero ? '' : 'pb-[clamp(3rem,5vw,4.5rem)]'
        }`}
        style={isPageHero ? { paddingBottom } : undefined}
      >
        {eyebrow && (
          <Fade delay={600}>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Fade>
        )}
        <Chars
          as="h1"
          className={
            hasPriceChip
              ? 'mb-[1.2rem] max-w-[12ch] text-[clamp(3rem,8.5vw,7.5rem)] tracking-[-0.02em] [text-shadow:0_2px_48px_rgba(5,8,26,0.5)]'
              : 'mb-[1.4rem] max-w-4xl text-[clamp(2.6rem,6.4vw,5.8rem)] tracking-[-0.04em] [text-shadow:0_2px_40px_rgba(5,8,26,0.45)]'
          }
          style={
            isPageHero && pageHeroHeadlineMaxWidth
              ? { maxWidth: pageHeroHeadlineMaxWidth }
              : undefined
          }
        >
          {headline}
        </Chars>
        {hasPriceChip ? (
          <div className="row">
            <div>{subheadAndCtas}</div>
            <Fade delay={1500} duration={1000} className="g-price liquid-glass">
              <span className="n">{priceChip?.value}</span>
              {priceChip?.label && <small>{priceChip.label}</small>}
            </Fade>
          </div>
        ) : tag ? (
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
