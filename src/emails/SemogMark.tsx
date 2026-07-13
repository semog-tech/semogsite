import { Section } from '@react-email/components'
import { barStyle, headerStyle } from './theme'

/**
 * Cabeçalho de marca dos e-mails: mesmo mark de 3 barras usado no OG card
 * (`src/lib/og.tsx`), sobre fundo navy — evita depender de `<img>` (SVG do
 * logo) cuja renderização é inconsistente entre clientes de e-mail.
 */
export function SemogMark() {
  return (
    <Section style={headerStyle}>
      <span style={barStyle} />
      <span style={barStyle} />
      <span style={barStyle} />
    </Section>
  )
}
