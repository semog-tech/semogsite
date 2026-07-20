import { Container } from '@/components/ui/Container'
import type { LegalHeroBlock as LegalHeroBlockType } from '@/payload-types'

/**
 * Fiel a `.legal-hero` de `_reference/privacidade.html`/`termos.html` (ver
 * doc completa em `config.ts` e no CSS portado em `theme.css`): `h1` plano
 * (sem `Chars`) e `p.upd` plano (sem `Fade`) — a seção não tem NENHUMA
 * animação no ref, ao contrário do `Hero` genérico.
 */
export function LegalHeroBlock({ headline, updatedText }: LegalHeroBlockType) {
  return (
    <section className="legal-hero">
      <Container>
        <h1>{headline}</h1>
        {updatedText && <p className="upd">{updatedText}</p>}
      </Container>
    </section>
  )
}
