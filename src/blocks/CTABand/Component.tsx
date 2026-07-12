import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import type { CTABandBlock as CTABandBlockType } from '@/payload-types'

/**
 * Faixa de CTA fiel ao padrão `.newsletter`/`.g-band` de `_reference`: fundo
 * `--grad-band` (aplicado via arbitrary value, já que o token só existe como
 * CSS var em `theme.css`, sem utilitário `bg-*` gerado), texto centralizado,
 * um único `Button`.
 */
export function CTABandBlock({ title, text, cta }: CTABandBlockType) {
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
