import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Reveal, Stagger } from '@/motion/reveal'
import type { ClubeBeneficiosBlock as ClubeBeneficiosBlockType } from '@/payload-types'

/**
 * Fiel à seção "Clube de benefícios" de `_reference/solucoes.html:693-724`:
 * `.sec-head` + `.club-grid` (`data-stagger`, 4 colunas com borda esquerda)
 * + `.club-note` (`data-reveal`). CSS portada em `theme.css`
 * (`.club-grid`, `.club-note` + responsivo `:318-322`).
 */
export function ClubeBeneficiosBlock({
  eyebrow,
  title,
  text,
  items,
  note,
}: ClubeBeneficiosBlockType) {
  if (!items || items.length === 0) return null

  return (
    <Section light white className="club">
      <Container>
        <Reveal className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h2 className="text-h2">{title}</h2>
          {text && <p className="max-w-[58ch] text-lead text-fg-2">{text}</p>}
        </Reveal>

        <Stagger className="club-grid">
          {items.map((item) => (
            <div key={item.id ?? item.title}>
              {item.icon && (
                <span aria-hidden="true" className="mb-1 block text-[1.4rem] text-accent">
                  {item.icon}
                </span>
              )}
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </Stagger>

        {note && (
          <Reveal as="p" className="club-note">
            {note}
          </Reveal>
        )}
      </Container>
    </Section>
  )
}
