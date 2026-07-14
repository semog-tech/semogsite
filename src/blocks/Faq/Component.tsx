import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/motion/reveal'
import type { FaqBlock as FaqBlockType } from '@/payload-types'

/**
 * Accordion de perguntas frequentes fiel a `.faq details`/`.faq summary .plus`
 * de `_reference/solucoes.html` e `_reference/garante.html`: `<details>` e
 * `<summary>` nativos (funciona sem JS, sem client component), indicador
 * "+" em pílula que gira 45° quando aberto (`details[open] summary .plus`).
 * Seção clara (`sec-light`), fiel ao `.faq.sec-light` de `solucoes.html`.
 * `isLast` decide a borda inferior via índice (não `last:`) porque cada
 * `<details>` é envolvido por um wrapper do `Reveal`, o que quebraria a
 * relação de irmãos exigida por `:last-child`. Cada pergunta entra via
 * `Reveal`. `tightTop` zera o padding-top (ver doc do campo em
 * `Faq/config.ts`). `dark` (sem `white`) troca `.sec-light` pelo fundo
 * `--bg-deep` escuro do `.faq` de `/garante`.
 */
export function FaqBlock({ eyebrow, title, white, tightTop, dark, items }: FaqBlockType) {
  if (!items || items.length === 0) return null
  const isDark = !!dark && !white

  return (
    <Section
      light={!isDark}
      white={!!white}
      className={`${tightTop ? '!pt-0' : ''} ${isDark ? 'bg-bg-deep' : ''}`}
    >
      <Container>
        {(eyebrow || title) && (
          <div className="mb-[clamp(2.5rem,6vw,4.5rem)] max-w-2xl">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <h2 className="text-h2">{title}</h2>}
          </div>
        )}
        <div>
          {items.map((item, i) => {
            const isLast = i === items.length - 1
            return (
              <Reveal key={item.id ?? item.question} delay={i * 0.05}>
                <details
                  className={`group border-t border-line py-[1.4rem] ${isLast ? 'border-b' : ''}`}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-[1.25rem] font-medium [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-pill border border-line-strong font-body text-[1.2rem] font-normal text-accent transition-[transform,background] duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-open:rotate-45 group-open:bg-accent/10"
                    >
                      +
                    </span>
                  </summary>
                  <p className="m-0 mt-4 max-w-[68ch] text-fg-2">{item.answer}</p>
                </details>
              </Reveal>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}
