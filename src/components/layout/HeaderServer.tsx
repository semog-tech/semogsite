import { site } from '@/../content/site'
import { Nav } from './Nav'

/**
 * Server component: lê o global `header` de `content/site.ts` (Fase 2 —
 * fora do CMS, sem `findGlobal`/banco). Delega a pílula "liquid glass" fixa,
 * o toggle de scroll (`.nav.is-scrolled`) e o menu mobile de `_reference` à
 * ilha client `<Nav>`.
 */
export async function HeaderServer() {
  const { navItems, cta, clientArea } = site.header

  return (
    <Nav navItems={navItems} cta={cta} clientArea={clientArea} logoSrc="/semog-logo-light.svg" />
  )
}
