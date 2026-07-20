import { getPayloadClient } from '@/lib/payload'
import type { Header } from '@/payload-types'
import { Nav } from './Nav'

/**
 * Nav padrão usada quando o global `header` está vazio ou inacessível (sem
 * banco de dados) — espelha a navegação de `_reference/index.html`.
 */
const FALLBACK_NAV_ITEMS: NonNullable<Header['navItems']> = [
  { label: 'A Semog', href: '/semog' },
  { label: 'Soluções', href: '/solucoes' },
  { label: 'Incorporadoras', href: '/incorporadoras' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contato', href: '/contato' },
]

const FALLBACK_CTA = { label: 'Solicitar proposta', href: '/proposta' }

const FALLBACK_CLIENT_AREA = {
  label: 'Área do cliente',
  href: 'https://semog.superlogica.net/clients/areadocondomino',
}

async function getHeaderGlobal(): Promise<Header | null> {
  try {
    const payload = await getPayloadClient()
    const header = await payload.findGlobal({ slug: 'header' })
    return header ?? null
  } catch {
    // Sem banco de dados (ex.: rota /styleguide sem .env) — segue com o fallback.
    return null
  }
}

/**
 * Server component: busca o global `header` via Local API e nunca lança —
 * na ausência de DB ou de conteúdo cadastrado, cai no fallback mínimo
 * (nav padrão) para que o layout do frontend siga renderizável. Delega a
 * pílula "liquid glass" fixa, o toggle de scroll (`.nav.is-scrolled`) e o
 * menu mobile de `_reference` à ilha client `<Nav>`.
 */
export async function HeaderServer() {
  const header = await getHeaderGlobal()
  const navItems = header?.navItems?.length ? header.navItems : FALLBACK_NAV_ITEMS
  const cta = header?.cta?.label && header?.cta?.href ? header.cta : FALLBACK_CTA
  const clientArea =
    header?.clientArea?.label && header?.clientArea?.href ? header.clientArea : FALLBACK_CLIENT_AREA

  return (
    <Nav navItems={navItems} cta={cta} clientArea={clientArea} logoSrc="/semog-logo-light.svg" />
  )
}
