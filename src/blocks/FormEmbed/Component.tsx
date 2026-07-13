import { ContactForm } from '@/components/forms/ContactForm'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/ui/Section'
import type { FormEmbedBlock as FormEmbedBlockType } from '@/payload-types'

/**
 * Renderiza o form client certo pra `formType` dentro de um card fiel a
 * `.prop-form` (`_reference/proposta.html:51-58`): borda `line-strong`,
 * fundo navy translúcido com blur, `radius-card`/`shadow-card`. Cabeçalho
 * (`eyebrow`/`title`/`text`) é opcional e centralizado, coluna única —
 * diferente do layout de duas colunas do ref (form + trust-panel), porque
 * este bloco precisa funcionar solto em qualquer página, não só em
 * `/proposta`.
 *
 * `formType: 'proposta'` ainda não renderiza nada — `<PropostaForm>` é
 * escopo da Task 6 do Plano 4b. Não quebra a página: o card fica vazio até
 * lá.
 */
export function FormEmbedBlock({ formType, eyebrow, title, text }: FormEmbedBlockType) {
  if (!formType) return null

  return (
    <Section>
      <Container>
        <div className="mx-auto max-w-[680px]">
          {(eyebrow || title || text) && (
            <div className="mb-[clamp(2rem,5vw,3rem)] text-center">
              {eyebrow && (
                <div className="flex justify-center">
                  <Eyebrow>{eyebrow}</Eyebrow>
                </div>
              )}
              {title && <h2 className="text-h2">{title}</h2>}
              {text && <p className="mx-auto max-w-[52ch] text-fg-2">{text}</p>}
            </div>
          )}
          <div className="rounded-card border border-line-strong bg-[rgba(10,16,46,0.55)] p-[clamp(1.8rem,4vw,2.8rem)] shadow-card backdrop-blur-md">
            {formType === 'contato' ? <ContactForm /> : null}
          </div>
        </div>
      </Container>
    </Section>
  )
}
