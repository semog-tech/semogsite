import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { GradientText } from '@/components/ui/GradientText'
import { Section } from '@/components/ui/Section'
import { Reveal, Stagger } from '@/motion/reveal'
import type { FeatureGridBlock as FeatureGridBlockType } from '@/payload-types'

type Feature = NonNullable<FeatureGridBlockType['features']>[number]

/**
 * Título com o trecho final destacado em gradiente — `.gx` (claro) ou
 * `.gx-ice` (escuro), mesmo padrão de `Benefits`'s `BentoTitle`. Sem
 * `accent`, ou se não bater com o fim de `title`, renderiza `title` inteiro
 * sem destaque.
 */
function GridTitle({
  title,
  accent,
  variant,
}: {
  title: string
  accent?: string | null
  variant: 'light' | 'dark'
}) {
  if (accent && title.endsWith(accent)) {
    return (
      <h2 className="text-h2">
        {title.slice(0, -accent.length)}
        <GradientText variant={variant === 'light' ? 'brand' : 'ice'}>{accent}</GradientText>
      </h2>
    )
  }
  return <h2 className="text-h2">{title}</h2>
}

/**
 * `.svc-card` de `_reference/administracao-de-condominios.html:91-105`:
 * card branco (não o branco automático de `.sec-light .why-card` —
 * sombra/borda próprias) com badge `.ic` (gradiente da marca) + SVG inline.
 */
function LightCard({ feature }: { feature: Feature }) {
  return (
    <div className="h-full rounded-card border border-[rgba(16,26,72,0.08)] bg-white p-[1.9rem] shadow-[0_18px_45px_-26px_rgba(16,26,72,0.22)] transition-[transform,box-shadow] duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[6px] hover:shadow-[0_26px_60px_-26px_rgba(16,26,72,0.3)]">
      {feature.iconSvg && (
        <span
          aria-hidden="true"
          className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-[linear-gradient(135deg,#1B2D70,#3B54BE)]"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: markup vem do CMS (seed/admin Payload), não de input de usuário final
            dangerouslySetInnerHTML={{ __html: feature.iconSvg }}
          />
        </span>
      )}
      <h3 className="mt-4 mb-[0.4rem] text-[1.25rem]">{feature.title}</h3>
      <p className="m-0 text-[0.92rem] text-fg-2">{feature.description}</p>
    </div>
  )
}

/**
 * `.why-card` de `_reference/incorporadoras.html`: card ice-tint (as
 * classes Tailwind `border-line`/`text-fg-2` resolvem via CSS custom
 * property — dentro de `Section light` viram os valores claros do
 * `.sec-light`, sem precisar de props extras aqui). `iconSvg` (quando
 * presente) renderiza como o glifo NU 34x34 de `.why-card .glyph`, tendo
 * prioridade sobre `icon` (glifo texto/pílula, comportamento antigo,
 * preservado para as páginas de cidade que só usam `icon`).
 */
function DarkCard({ feature }: { feature: Feature }) {
  return (
    <div className="h-full rounded-card border border-line bg-[linear-gradient(180deg,rgba(173,213,235,0.045),rgba(173,213,235,0.01))] p-[2.2rem] transition-[transform,border-color] duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[5px] hover:border-line-strong">
      {feature.iconSvg ? (
        <span aria-hidden="true" className="mb-[1.4rem] inline-flex">
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ADD5EB"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: markup vem do CMS (seed/admin Payload), não de input de usuário final
            dangerouslySetInnerHTML={{ __html: feature.iconSvg }}
          />
        </span>
      ) : (
        feature.icon && (
          <span
            aria-hidden="true"
            className="mb-[1.4rem] inline-flex h-12 w-12 items-center justify-center rounded-pill border border-line-strong text-lg text-accent"
          >
            {feature.icon}
          </span>
        )
      )}
      <h3 className="text-[1.3rem]">{feature.title}</h3>
      <p className="m-0 text-[0.98rem] text-fg-2">{feature.description}</p>
    </div>
  )
}

/**
 * `.svc-rows` fiel a `_reference/administradora-de-condominios-recife.html:
 * 366-377`: uma linha por serviço (`title` em negrito + `badge` opcional,
 * ex.: "EXCLUSIVA"), hover desloca padding e escurece fundo/texto — CSS
 * ported em `theme.css` (`.svc-rows > div`), não dá pra expressar a
 * transição de 2 easings distintos (background/padding-left) como utility
 * Tailwind arbitrária.
 */
function ServiceRow({ feature }: { feature: Feature }) {
  return (
    <div>
      <strong>{feature.title}</strong>
      {feature.badge && (
        <span className="text-[0.82rem] font-semibold text-accent">{feature.badge}</span>
      )}
    </div>
  )
}

/**
 * `.svc-sec` fiel a `_reference/administradora-de-condominios-recife.html:
 * 158-174,358-380`: coluna esquerda (h2 sticky + `intro`) em `Reveal`,
 * coluna direita (`.svc-rows`) em outro `Reveal` (`delay=0.12`, mesmo
 * `data-reveal-delay="0.12"` do ref — reveal do grupo, não por linha).
 * `padding-block`/`border-top` do `<section>` aplicados via `style`/
 * className diretamente aqui (valor bespoke, mesmo escape hatch do
 * `.cost`/`.g-partner`, ver `theme.css`).
 */
function RowsVariant({
  eyebrow,
  title,
  titleAccent,
  intro,
  features,
  moreLink,
}: {
  eyebrow?: string | null
  title?: string | null
  titleAccent?: string | null
  intro?: string | null
  features: Feature[]
  moreLink?: { label?: string | null; href?: string | null } | null
}) {
  return (
    <Section
      light
      className="svc-sec border-t border-line"
      style={{ paddingBlock: 'clamp(4rem,8vw,7rem)' }}
    >
      <Container>
        <div className="wrap">
          <Reveal>
            <div>
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              {title && <GridTitle title={title} accent={titleAccent} variant="light" />}
              {intro && <p className="mt-4 max-w-[44ch] text-fg-2">{intro}</p>}
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="svc-rows">
              {features.map((feature) => (
                <ServiceRow key={feature.id ?? feature.title} feature={feature} />
              ))}
              {moreLink?.label && moreLink?.href && (
                <div className="svc-more">
                  <a className="link-arrow" href={moreLink.href}>
                    {moreLink.label}
                    <span className="arr" aria-hidden="true">
                      →
                    </span>
                  </a>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  )
}

/**
 * Grid de cards, três variantes (`variant`, default `dark`):
 *
 * - `dark` — fiel ao padrão `.why-card` de `_reference/incorporadoras.html`.
 *   Sem `light`/`stagger`, comportamento inalterado (cards sobre fundo
 *   escuro, entrada por `Reveal` individual). Com `light`/`stagger` (ex.:
 *   "Por que Semog" do próprio `/incorporadoras`, `.why-grid.sec-light.white`),
 *   o mesmo `DarkCard` passa a renderizar dentro de `Section light`, com
 *   `columns:'2'` e entrada em grupo via `Stagger`.
 * - `light` — fiel a `.svc.sec-light` > `.svc-grid` de
 *   `_reference/administracao-de-condominios.html:230-286`: `Section light`
 *   (sem `white` — o ref não usa `.white` nesta seção) e a grade inteira
 *   entra via `Stagger` (`data-stagger` no ref, não reveals individuais) —
 *   `light`/`white`/`columns`/`stagger` não têm efeito aqui, já que este
 *   variant sempre foi claro/3-col/stagger.
 * - `rows` — fiel a `.svc-sec`/`.svc-rows` das landings de cidade (ver
 *   `RowsVariant` acima) — NÃO é grade de cards, é lista vertical plana com
 *   coluna de intro sticky ao lado.
 *
 * Cabeçalho (`eyebrow`+`title`) entra via `Reveal`, fiel aos `data-reveal`
 * de `.frame-head`/`.sec-head` do ref (o header antes não tinha reveal
 * algum — motion adicionada nesta revisão, vale para as três variantes).
 */
export function FeatureGridBlock({
  variant,
  light,
  white,
  columns,
  stagger,
  eyebrow,
  title,
  titleAccent,
  intro,
  moreLink,
  features,
}: FeatureGridBlockType) {
  if (!features || features.length === 0) return null

  if (variant === 'rows') {
    return (
      <RowsVariant
        eyebrow={eyebrow}
        title={title}
        titleAccent={titleAccent}
        intro={intro}
        features={features}
        moreLink={moreLink}
      />
    )
  }

  const isLightVariant = variant === 'light'
  const sectionLight = isLightVariant || !!light
  const useStagger = isLightVariant || !!stagger
  const gridCols =
    columns === '2'
      ? 'grid grid-cols-1 gap-[1.4rem] sm:grid-cols-2'
      : 'grid grid-cols-1 gap-[1.4rem] sm:grid-cols-2 lg:grid-cols-3'
  const renderCard = (feature: Feature) =>
    isLightVariant ? (
      <LightCard key={feature.id ?? feature.title} feature={feature} />
    ) : (
      <DarkCard key={feature.id ?? feature.title} feature={feature} />
    )

  return (
    <Section light={sectionLight} white={isLightVariant ? false : !!white}>
      <Container>
        {(eyebrow || title) && (
          <Reveal className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && (
              <GridTitle
                title={title}
                accent={titleAccent}
                variant={sectionLight ? 'light' : 'dark'}
              />
            )}
          </Reveal>
        )}
        {useStagger ? (
          <Stagger className={gridCols}>{features.map(renderCard)}</Stagger>
        ) : (
          <div className={gridCols}>
            {features.map((feature, i) => (
              <Reveal key={feature.id ?? feature.title} delay={i * 0.06}>
                <DarkCard feature={feature} />
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </Section>
  )
}
