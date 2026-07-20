import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { GradientText } from '@/components/ui/GradientText'
import { Reveal } from '@/motion/reveal'
import type { CustoChecklistBlock as CustoChecklistBlockType } from '@/payload-types'

/**
 * Título com o trecho final em `.gx` (a seção é sempre clara, `.sec-light
 * white`) — mesmo padrão de `Benefits`'s `BentoTitle`/`CTABand`'s
 * `CenteredTitle`.
 */
function Title({ title, accent }: { title: string; accent?: string | null }) {
  if (accent && title.endsWith(accent)) {
    return (
      <h2>
        {title.slice(0, -accent.length)}
        <GradientText variant="brand">{accent}</GradientText>
      </h2>
    )
  }
  return <h2>{title}</h2>
}

/**
 * Fiel a `.cost.sec-light.white` de
 * `_reference/administracao-de-condominios.html:128-152,311-346`: prosa
 * (h2 com trecho em gradiente + parágrafos + CTA) ao lado do `.cost-card`
 * (fundo `--grad-band`, eyebrow "top" + checklist com tick em traço via
 * `li::before`). `<section>` puro (não `Section`, que força um
 * `padding-block` genérico) — mesmo motivo do `WordsSection`/`CTABand`
 * `variant:'centered'` acima: `.cost`/`.wrap`/`.cost-card` (CSS portado em
 * `theme.css`) já cuidam do padding-block e do grid de 2 colunas próprios
 * do ref, incluindo o breakpoint que empilha em telas estreitas.
 */
export function CustoChecklistBlock({
  title,
  titleAccent,
  paragraphs,
  cta,
  checklistLabel,
  checklist,
}: CustoChecklistBlockType) {
  if (!checklist || checklist.length === 0) return null

  return (
    <section className="cost sec-light white">
      <Container>
        <div className="wrap">
          <Reveal className="prose">
            <Title title={title} accent={titleAccent} />
            {paragraphs?.map((p) => (
              <p key={p.id ?? p.text}>{p.text}</p>
            ))}
            {cta?.label && cta.href && (
              <div className="mt-[1.8rem]">
                <Button href={cta.href} variant="primary" size="lg" withArrow>
                  {cta.label}
                </Button>
              </div>
            )}
          </Reveal>
          <Reveal delay={0.12} className="cost-card">
            <span className="top">{checklistLabel}</span>
            <ul>
              {checklist.map((item) => (
                <li key={item.id ?? item.text}>{item.text}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
