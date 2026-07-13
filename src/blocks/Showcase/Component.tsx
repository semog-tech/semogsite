import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Reveal, Stagger } from '@/motion/reveal'
import type { ShowcaseBlock as ShowcaseBlockType } from '@/payload-types'

/**
 * Seção split genérica, fiel ao par "Prestação de contas"
 * (`.showcase`, `_reference/solucoes.html:522-555`) e "Semog One"
 * (`.tech`/`.one-card`, `_reference/solucoes.html:644-687`): eyebrow +
 * título + texto de apoio + grade de features de um lado, placeholder de
 * mídia (borda + gradiente sutil + legenda, mesmo tratamento do
 * `AppShowcaseBlock`) do outro — proporção 4:3/16:10, não formato de
 * celular. `mediaSide` decide de que lado a mídia fica; nenhuma das duas
 * seções do ref usa `sec-light`, então o bloco roda sobre o fundo escuro
 * padrão. Sem imagem: `prestacao-contas.webp`/print do ERP entram depois,
 * com S3.
 */
export function ShowcaseBlock({
  eyebrow,
  title,
  text,
  features,
  cta,
  mediaSide,
}: ShowcaseBlockType) {
  const mediaLeft = mediaSide === 'left'

  const media = (
    <Reveal dir={mediaLeft ? 'left' : 'right'} className="w-full">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-card border border-line bg-[image:var(--grad-ice)] shadow-card">
        <div className="absolute inset-0 flex items-center justify-center bg-navy-950/55">
          <span className="text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-silver-100">
            {eyebrow || 'imagem ilustrativa'}
          </span>
        </div>
      </div>
    </Reveal>
  )

  const content = (
    <div>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Reveal as="h2" delay={0.1} className="text-h2">
        {title}
      </Reveal>
      {text && (
        <Reveal as="p" delay={0.16} className="mt-4 max-w-[52ch] text-fg-2">
          {text}
        </Reveal>
      )}

      {features && features.length > 0 && (
        <Stagger className="mt-[1.8rem] grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.id ?? feature.title} className="border-t border-line pt-4">
              <strong className="block text-[1rem] text-fg">{feature.title}</strong>
              <span className="text-[0.88rem] text-fg-2">{feature.description}</span>
            </div>
          ))}
        </Stagger>
      )}

      {cta?.label && cta?.href && (
        <Button href={cta.href} variant="primary" size="lg" withArrow className="mt-[2rem]">
          {cta.label}
        </Button>
      )}
    </div>
  )

  return (
    <Section>
      <Container
        className={`grid grid-cols-1 items-center gap-[clamp(2.5rem,6vw,5rem)] ${
          mediaLeft ? 'lg:grid-cols-[0.85fr_1.15fr]' : 'lg:grid-cols-[1.15fr_0.85fr]'
        }`}
      >
        {mediaLeft ? (
          <>
            {media}
            {content}
          </>
        ) : (
          <>
            {content}
            {media}
          </>
        )}
      </Container>
    </Section>
  )
}
