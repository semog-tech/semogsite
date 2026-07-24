import { site } from '@/../content/site'
import { FooterView } from './FooterView'

/**
 * Server component do rodapé — lê o global `footer` de `content/site.ts`
 * (Fase 2 — fora do CMS, sem `findGlobal`/banco). `FooterView` (ilha client,
 * `use client`) é quem escolhe o markup (`.footer` completo —
 * `_reference/index.html`/`semog.css:380-422` — ou só `.footer-bottom` nas
 * páginas legais, ver doc do componente) pelo pathname atual.
 */
export async function FooterServer() {
  const { footCta, columns, legalLinks, bottomText } = site.footer

  return (
    <FooterView
      footCta={footCta}
      columns={columns}
      legalLinks={legalLinks}
      bottomText={bottomText}
    />
  )
}
