import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/motion/reveal'
import type { CitiesBlock as CitiesBlockType, Media } from '@/payload-types'
import { CitiesAccordion, type CityPanelData } from './CitiesAccordion'

/**
 * Seção "Presença" fiel a `.cities.sec-light` de `_reference/index.html:701-744`:
 * accordion de painéis-foto (`.cities-acc`) — a `CitiesAccordion` (ilha
 * client) resolve qual painel fica `.is-open` no hover (desktop) / toque
 * (mobile), como o script inline do ref. O container `.cities-acc` em si é
 * revelado via `Reveal` (`data-reveal` no ref), não item a item.
 */
export function CitiesBlock({ eyebrow, title, items }: CitiesBlockType) {
  if (!items || items.length === 0) return null

  const panels: CityPanelData[] = items
    .filter((item) => item.image && typeof item.image === 'object')
    .map((item) => ({
      key: item.id ?? item.city,
      city: item.city,
      uf: item.uf,
      role: item.role,
      image: item.image as Media,
    }))

  if (panels.length === 0) return null

  return (
    <Section light>
      <Container>
        {(eyebrow || title) && (
          <div className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <h2 className="text-h2">{title}</h2>}
          </div>
        )}
        <Reveal className="cities-acc">
          <CitiesAccordion items={panels} />
        </Reveal>
      </Container>
    </Section>
  )
}
