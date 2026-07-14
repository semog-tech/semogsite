import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/motion/reveal'
import type { ProcessoTimelineBlock as ProcessoTimelineBlockType } from '@/payload-types'

type Item = NonNullable<ProcessoTimelineBlockType['items']>[number]

/**
 * `.proc-item` de `_reference/incorporadoras.html:89-107`: dot gradiente
 * (56px, ícone SVG 22x22 stroke ice-400) + h3/p + `.tags` pílulas. Cada item
 * entra via `Reveal` individual (`data-reveal` no ref).
 */
function ProcItem({ item }: { item: Item }) {
  return (
    <Reveal className="proc-item">
      <span className="dot" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ADD5EB"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: markup vem do CMS (seed/admin Payload), não de input de usuário final
          dangerouslySetInnerHTML={{ __html: item.iconSvg }}
        />
      </span>
      <div>
        <h3>{item.title}</h3>
        <p>{item.text}</p>
        {item.tags && item.tags.length > 0 && (
          <div className="tags">
            {item.tags.map((tag) => (
              <span key={tag.id ?? tag.label}>{tag.label}</span>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  )
}

/**
 * Fiel a `.process.sec-light` de `_reference/incorporadoras.html:219-278`:
 * `Section light` (`.process` em si não tem regras próprias — só o wrapper
 * `sec-light` importa) com o cabeçalho (`eyebrow`+`title`, mesmo padrão de
 * `FeatureGrid`/`Pillars`) e `.proc-list` — a linha viva em gradiente
 * (`::before`, portada em `theme.css`) + N `.proc-item`.
 */
export function ProcessoTimelineBlock({ eyebrow, title, items }: ProcessoTimelineBlockType) {
  if (!items || items.length === 0) return null

  return (
    <Section light>
      <Container>
        <Reveal className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h2>{title}</h2>
        </Reveal>
        <div className="proc-list">
          {items.map((item) => (
            <ProcItem key={item.id ?? item.title} item={item} />
          ))}
        </div>
      </Container>
    </Section>
  )
}
