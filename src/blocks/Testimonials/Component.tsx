import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/motion/reveal'
import type { TestimonialsBlock as TestimonialsBlockType } from '@/payload-types'

/**
 * Grid de depoimentos fiel a `.depo-card`/`.depo-grid` das páginas de
 * cidade do ref (ex.: `_reference/administradora-de-condominios-recife.html`,
 * seção "DEPOIMENTOS (claro)"): citação em tipografia display + `cite` com
 * autor e papel, separados por "·". Sem avatar/foto, como o ref — apenas
 * texto. Seção clara (`sec-light`), fiel ao `.depo.sec-light` do ref. Cards
 * entram via `Reveal` em cascata.
 */
export function TestimonialsBlock({ eyebrow, title, items }: TestimonialsBlockType) {
  if (!items || items.length === 0) return null

  return (
    <Section light>
      <Container>
        {(eyebrow || title) && (
          <div className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <h2 className="text-h2">{title}</h2>}
          </div>
        )}
        <div className="grid grid-cols-1 gap-[1.4rem] sm:grid-cols-2">
          {items.map((item, i) => (
            <Reveal key={item.id ?? item.author} delay={i * 0.08}>
              <div className="h-full rounded-card border border-line bg-bg-raise p-[2rem]">
                <blockquote className="m-0 mb-[1.2rem] font-display text-[clamp(1.1rem,2vw,1.35rem)] leading-[1.35] font-medium">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <cite className="text-[0.88rem] not-italic text-fg-3">
                  {item.author}
                  {item.role && ` · ${item.role}`}
                </cite>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  )
}
