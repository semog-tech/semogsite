import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/motion/reveal'
import type { NewsletterBlock as NewsletterBlockType } from '@/payload-types'
import { NewsletterForm } from './NewsletterForm'

/**
 * `.newsletter` fiel a `_reference/blog.html:229-238`: faixa `--grad-band`
 * (CSS em `theme.css`, ver `Newsletter/config.ts`) com h2/p/form
 * centralizados, cada um entrando via `Reveal` escalonado — mesmo padrão de
 * `CTABand`'s `.final-cta` (`data-reveal` no ref, sem `data-reveal-delay`
 * explícito nos 3 elementos, mas o efeito de entrada em cascata é
 * equivalente com pequenos delays). `Section` (sem `light`) já reproduz o
 * `padding-block: var(--section)` genérico do ref (a seção não tem override
 * de padding), então só a classe `newsletter` (bg/borda/texto) é somada.
 */
export function NewsletterBlock({
  title,
  text,
  placeholder,
  buttonLabel,
  successMessage,
}: NewsletterBlockType) {
  return (
    <Section className="newsletter">
      <Container>
        <Reveal as="h2">{title}</Reveal>
        {text && (
          <Reveal as="p" delay={0.1}>
            {text}
          </Reveal>
        )}
        <Reveal delay={0.2}>
          <NewsletterForm
            placeholder={placeholder || 'Seu melhor e-mail'}
            buttonLabel={buttonLabel || 'Assinar'}
            successMessage={successMessage || 'Inscrição recebida. Até o próximo e-mail!'}
          />
        </Reveal>
      </Container>
    </Section>
  )
}
