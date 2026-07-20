import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/motion/reveal'
import type { BairrosBlock as BairrosBlockType } from '@/payload-types'

/**
 * Bloco novo — lista de bairros atendidos, fiel a `.hood`/`.hood-pills` das
 * landings de cidade do ref (ex.:
 * `_reference/administradora-de-condominios-recife.html:340-356`, estilo
 * inline da própria página, idêntico nas 4 landings). `Section light white`
 * (`.hood.sec-light.white`), com `padding-top:0` via `style` — a seção cola
 * direto na `.unit-sec` acima, ambas claras (mesmo escape hatch usado pelo
 * `pageHero*` do `Hero`, ver `Section.tsx`). Título fiel a `.hood h3`
 * (rótulo pequeno, não um `h2`/`Eyebrow` — o ref não usa `.frame-lbl` aqui).
 * O grupo inteiro de pills entra via um único `Reveal` (`data-reveal` no
 * ref está no `.hood-pills`, não por pill).
 */
export function BairrosBlock({ title, items, note }: BairrosBlockType) {
  if (!items || items.length === 0) return null

  return (
    <Section light white className="hood" style={{ paddingTop: 0 }}>
      <Container>
        <h3>{title}</h3>
        <Reveal className="hood-pills">
          {items.map((item) => (
            <span key={item.id ?? item.label}>{item.label}</span>
          ))}
        </Reveal>
        {note && <p className="note">{note}</p>}
      </Container>
    </Section>
  )
}
