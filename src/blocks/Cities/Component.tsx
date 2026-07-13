import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Stagger } from '@/motion/reveal'
import type { CitiesBlock as CitiesBlockType } from '@/payload-types'

/**
 * Grid de cidades fiel à seção "Presença" (`.cities-acc`) de
 * `_reference/index.html`: cada card traz papel (Matriz/Filial) e UF da
 * cidade. Sem foto por ora — placeholder textual até as chaves S3
 * existirem; a matriz ganha destaque com borda de acento, ecoando o painel
 * `.hq` do ref. Seção clara (`sec-light`), como no ref (`.cities.sec-light`).
 */
export function CitiesBlock({ eyebrow, title, items }: CitiesBlockType) {
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
        <Stagger className="grid grid-cols-2 gap-[1.4rem] lg:grid-cols-4">
          {items.map((item) => {
            const isHq = item.role?.toLowerCase() === 'matriz'
            return (
              <div
                key={item.id ?? item.city}
                className={`rounded-card border p-[1.8rem] ${
                  isHq
                    ? 'border-accent/60 bg-[linear-gradient(180deg,rgba(173,213,235,0.06),rgba(173,213,235,0.01))]'
                    : 'border-line'
                }`}
              >
                {item.role && (
                  <span className="mb-3 block text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-accent">
                    {item.role}
                  </span>
                )}
                <h3 className="text-[1.3rem]">{item.city}</h3>
                <span className="text-[0.9rem] text-fg-3">{item.uf}</span>
              </div>
            )
          })}
        </Stagger>
      </Container>
    </Section>
  )
}
