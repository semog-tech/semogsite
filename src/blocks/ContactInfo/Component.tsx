import { ImageMedia } from '@/components/Media/ImageMedia'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { GradientText } from '@/components/ui/GradientText'
import { Section } from '@/components/ui/Section'
import { Reveal, Stagger } from '@/motion/reveal'
import type { ContactInfoBlock as ContactInfoBlockType, Media } from '@/payload-types'

/** Título com o trecho final em `.gx` — mesmo padrão de `FeatureGrid`'s `GridTitle`. */
function CardTitle({ title, accent }: { title: string; accent?: string | null }) {
  if (accent && title.endsWith(accent)) {
    return (
      <h2>
        {title.slice(0, -accent.length)}
        <GradientText variant="brand">{accent}</GradientText>
      </h2>
    )
  }
  return <h2>{title}</h2>
}

/**
 * Duas variantes (`variant`, default `grid`):
 *
 * - `grid` — cartões compactos fiel à seção "Unidades" (`.unit`,
 *   `_reference/contato.html:270-338`), sem foto. Comportamento inalterado.
 * - `card` — o cartão rico `.unit-sec`/`.unit-card` das landings de cidade
 *   (ex.: `_reference/administradora-de-condominios-recife.html:110-140,
 *   312-338`): `Section light white` (`.unit-sec.sec-light.white`) com
 *   `padding-block` bespoke via `style` (mesmo escape hatch do `pageHero*`
 *   do `Hero` — o ref usa `clamp(4rem,8vw,7rem)`, diferente do clamp
 *   genérico de `Section`), frame-head (`Eyebrow`, mesma substituição
 *   sitewide de `.frame-lbl` já usada em `Socios`/`Testimonials`/etc.) +
 *   `.unit-card` (foto + chip de vidro + `dl` de contato + 2 ações) em
 *   `Reveal` separado (2 `data-reveal` distintos no ref). Usa só
 *   `items[0]` — o ref sempre mostra 1 unidade nesse padrão.
 */
export function ContactInfoBlock({
  variant,
  eyebrow,
  title,
  titleAccent,
  items,
  whatsapp,
}: ContactInfoBlockType) {
  if (!items || items.length === 0) return null

  if (variant === 'card') {
    const item = items[0]
    const photo = item.photo && typeof item.photo === 'object' ? (item.photo as Media) : undefined
    return (
      <Section light white className="unit-sec" style={{ paddingBlock: 'clamp(4rem,8vw,7rem)' }}>
        <Container>
          {eyebrow && (
            <Reveal className="mb-[clamp(2.5rem,6vw,4.5rem)]">
              <Eyebrow>{eyebrow}</Eyebrow>
            </Reveal>
          )}
          <Reveal>
            <div className="unit-card">
              <div className="photo">
                {photo && (
                  <ImageMedia
                    resource={photo}
                    fill
                    className="absolute inset-0 object-cover"
                    sizes="(min-width: 900px) 45vw, 100vw"
                  />
                )}
                {item.chip && <span className="chip liquid-glass">{item.chip}</span>}
              </div>
              <div className="info">
                {title && <CardTitle title={title} accent={titleAccent} />}
                <dl className="unit-rows">
                  <div>
                    <dt>Endereço</dt>
                    <dd>
                      {item.address}
                      {item.addressDetail && <small>{item.addressDetail}</small>}
                    </dd>
                  </div>
                  <div>
                    <dt>Telefone</dt>
                    <dd>{item.phone}</dd>
                  </div>
                  {item.whatsappDisplay && (
                    <div>
                      <dt>WhatsApp</dt>
                      <dd>{item.whatsappDisplay}</dd>
                    </div>
                  )}
                  {item.hours && (
                    <div>
                      <dt>Horário</dt>
                      <dd>{item.hours}</dd>
                    </div>
                  )}
                </dl>
                <div className="unit-actions">
                  {item.mapsHref && (
                    <Button href={item.mapsHref} variant="primary" withArrow>
                      Como chegar
                    </Button>
                  )}
                  {whatsapp && (
                    <Button href={`https://wa.me/${whatsapp}`} variant="ghost">
                      Chamar no WhatsApp
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
    )
  }

  return (
    <Section>
      <Container>
        <div className="mb-[clamp(2.5rem,6vw,4.5rem)] flex flex-wrap items-end justify-between gap-6">
          {(eyebrow || title) && (
            <div className="max-w-2xl">
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              {title && <h2 className="text-h2">{title}</h2>}
            </div>
          )}
          {whatsapp && (
            <Button href={`https://wa.me/${whatsapp}`} variant="primary" size="md" withArrow>
              Falar no WhatsApp
            </Button>
          )}
        </div>
        <Stagger className="grid grid-cols-1 gap-[1.4rem] sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.id ?? item.city} className="rounded-card border border-line p-[1.8rem]">
              <span className="mb-3 block text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-accent">
                {item.uf}
              </span>
              <h3 className="text-[1.2rem]">{item.city}</h3>
              <p className="mt-3 mb-1 text-[0.9rem] text-fg-2">{item.address}</p>
              <p className="m-0 text-[0.9rem] text-fg-3">{item.phone}</p>
            </div>
          ))}
        </Stagger>
      </Container>
    </Section>
  )
}
