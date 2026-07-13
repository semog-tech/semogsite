import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Stagger } from '@/motion/reveal'
import type { BenefitsBlock as BenefitsBlockType } from '@/payload-types'

/**
 * Grade de vantagens fiel ao "Clube de benefícios" (`.club-grid`,
 * `_reference/solucoes.html:693-724`): cards de perk (internet, fornecedores,
 * seguros, convênios locais) numerados, mesmo tratamento do `GaranteBlock`
 * ("Como funciona"), já que aqui não há campo de ícone dedicado. Seção clara
 * e branca (`sec-light white`), fiel ao `.club.sec-light.white` do ref.
 */
export function BenefitsBlock({ eyebrow, title, items }: BenefitsBlockType) {
  if (!items || items.length === 0) return null

  return (
    <Section light white>
      <Container>
        {(eyebrow || title) && (
          <div className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <h2 className="text-h2">{title}</h2>}
          </div>
        )}
        <Stagger className="grid grid-cols-1 gap-[1.4rem] sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <div key={item.id ?? item.title} className="rounded-card border border-line p-[1.8rem]">
              <span
                aria-hidden="true"
                className="mb-3 block text-[0.82rem] font-semibold text-accent"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="text-[1.15rem]">{item.title}</h3>
              <p className="m-0 text-[0.95rem] text-fg-2">{item.description}</p>
            </div>
          ))}
        </Stagger>
      </Container>
    </Section>
  )
}
