import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { GradientText } from '@/components/ui/GradientText'
import { Section } from '@/components/ui/Section'
import { Reveal, Stagger } from '@/motion/reveal'
import type { ReconhecimentoBlock as ReconhecimentoBlockType } from '@/types/blocks'

/**
 * Faixa de reconhecimento — prova validada por terceiro, que é a única que o
 * site não consegue produzir sozinho. Criada em 27/08/2026 para o G20 Condo
 * da Superlógica, mas o bloco é genérico: qualquer prêmio/ranking futuro
 * entra por conteúdo, sem componente novo.
 *
 * Três decisões que sustentam o formato:
 *
 * 1. **Faixa, não hero secundário.** Reconhecimento envelhece — em três meses
 *    a novidade acaba e o que sobra é o fato. Uma faixa continua verdadeira
 *    depois que a comemoração passa; um bloco de campanha teria que ser
 *    removido. Daí o `py` compacto e a borda nas duas pontas, mesmo recurso
 *    do `Registros`.
 * 2. **O histórico vale mais que a edição atual.** Ficar entre os 20 uma vez
 *    é resultado; ficar três ciclos seguidos é padrão. Por isso `history`
 *    ocupa metade do bloco em vez de virar nota de rodapé.
 * 3. **O `cta` é opcional e discreto** (`ghost`): quem quiser a história vai
 *    ao post, mas a faixa precisa se sustentar sem clique, para o leitor que
 *    só passa os olhos.
 *
 * CUIDADO COM O ESCOPO NO `title` — regra permanente de redação, não estilo:
 * o Ranking Top 200 classifica clientes da Superlógica, não o mercado
 * brasileiro. "5º lugar no ranking Top 200" é verdadeiro; "5ª melhor
 * administradora do Brasil" é publicidade comparativa sem lastro. Mesma
 * família de risco que já obrigou a trocar "assessoria jurídica" por
 * "suporte jurídico com escritório parceiro".
 */
export function ReconhecimentoBlock({
  eyebrow,
  title,
  titleAccent,
  text,
  history,
  cta,
}: ReconhecimentoBlockType) {
  const accented = titleAccent && title.endsWith(titleAccent)
  return (
    <Section className="!py-[clamp(3rem,6.5vw,5rem)] border-y border-line bg-[image:var(--grad-band)]">
      {/* Três filhos diretos do grid, e não "coluna de texto + coluna de
          histórico", por causa da ordem no mobile: com o `cta` dentro da
          coluna de texto, o empilhamento punha o botão ANTES do histórico —
          pedia a ação antes de mostrar a prova. Como filhos irmãos, o DOM já
          lê texto → histórico → botão no mobile, e o posicionamento explícito
          de linha/coluna reconstrói as duas colunas a partir de `lg`. */}
      <Container className="grid grid-cols-1 items-center gap-x-16 gap-y-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="lg:col-start-1 lg:row-start-1">
          {eyebrow && (
            <Reveal>
              <Eyebrow>{eyebrow}</Eyebrow>
            </Reveal>
          )}
          <Reveal as="h2" delay={0.06} className="m-0 max-w-[22ch] text-h3">
            {accented ? (
              <>
                {title.slice(0, -(titleAccent as string).length)}
                <GradientText variant="ice">{titleAccent}</GradientText>
              </>
            ) : (
              title
            )}
          </Reveal>
          <Reveal as="p" delay={0.12} className="mt-4 mb-0 max-w-[52ch] text-fg-2">
            {text}
          </Reveal>
        </div>

        {history && history.length > 0 && (
          <Stagger className="flex flex-col lg:col-start-2 lg:row-span-2 lg:row-start-1">
            {history.map((item) => (
              <div
                key={item.id ?? item.period}
                className="flex items-baseline justify-between gap-6 border-b border-line py-3.5 last:border-b-0"
              >
                <span className="text-[0.85rem] uppercase tracking-[0.1em] text-fg-3">
                  {item.period}
                </span>
                <span className="text-[1.05rem] font-semibold text-fg">{item.result}</span>
              </div>
            ))}
          </Stagger>
        )}

        {cta?.label && cta?.href && (
          <Reveal delay={0.18} className="lg:col-start-1 lg:row-start-2">
            <Button href={cta.href} variant="ghost" withArrow>
              {cta.label}
            </Button>
          </Reveal>
        )}
      </Container>
    </Section>
  )
}
