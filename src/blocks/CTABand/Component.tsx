import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { GradientText } from '@/components/ui/GradientText'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/motion/reveal'
import type { CTABandBlock as CTABandBlockType } from '@/payload-types'

/** Título com o trecho final em `.gx-ice` — mesmo padrão de `Benefits`'s `BentoTitle`. */
function CenteredTitle({ title, accent }: { title: string; accent?: string | null }) {
  if (accent && title.endsWith(accent)) {
    return (
      <Reveal as="h2">
        {title.slice(0, -accent.length)}
        <GradientText variant="ice">{accent}</GradientText>
      </Reveal>
    )
  }
  return <Reveal as="h2">{title}</Reveal>
}

/**
 * Faixa de CTA com duas variantes (`variant`, default `band`):
 *
 * - `band` — fiel ao padrão `.newsletter`/`.g-band` de `_reference`: fundo
 *   `--grad-band` (arbitrary value, já que o token só existe como CSS var em
 *   `theme.css`, sem utilitário `bg-*` gerado), texto centralizado, um único
 *   `Button`. Comportamento inalterado desde a Task 3b/1.
 * - `centered` — fiel a `.final-cta` de `_reference/index.html:759-770`: CTA
 *   final da home. `<section>` puro (não `Section`, que força `py-*` — mesmo
 *   padrão do Hero/HumanQuote) com o glow radial `::before` portado pra
 *   `theme.css`, h2/p/botão em `Reveal` escalonado (0/0.1/0.2, como
 *   `data-reveal`/`data-reveal-delay` no ref) e o botão branco magnético
 *   (`.btn-white ... data-magnetic`).
 */
export function CTABandBlock({
  title,
  titleAccent,
  text,
  cta,
  variant,
  buttonVariant,
}: CTABandBlockType) {
  if (variant === 'centered') {
    return (
      <section className="final-cta">
        <Container className="relative z-[2]">
          <CenteredTitle title={title} accent={titleAccent} />
          {text && (
            <Reveal as="p" delay={0.1}>
              {text}
            </Reveal>
          )}
          <Reveal delay={0.2}>
            <Button href={cta.href} variant={buttonVariant ?? 'white'} size="lg" withArrow magnetic>
              {cta.label}
            </Button>
          </Reveal>
        </Container>
      </section>
    )
  }

  return (
    <Section className="border-y border-line bg-[image:var(--grad-band)] text-center">
      <Container>
        <h2 className="mx-auto mb-4 max-w-[22ch] text-h2">{title}</h2>
        {text && <p className="mx-auto mb-8 max-w-[46ch] text-fg-2">{text}</p>}
        <Button href={cta.href} variant="primary" size="lg" withArrow>
          {cta.label}
        </Button>
      </Container>
    </Section>
  )
}
