import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { getPayloadClient } from '@/lib/payload'
import type { Header } from '@/payload-types'

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
 * (logo + nav padrão) para que o layout do frontend siga renderizável.
 * A pílula "liquid glass" fixa e o comportamento de scroll (`.nav.is-scrolled`)
 * de `_reference` ficam para a ilha client dedicada — aqui é só a estrutura.
 */
export async function HeaderServer() {
  const header = await getHeaderGlobal()
  const navItems = header?.navItems?.length ? header.navItems : FALLBACK_NAV_ITEMS
  const cta = header?.cta?.label && header?.cta?.href ? header.cta : FALLBACK_CTA

  return (
    <header className="fixed inset-x-0 top-0 z-40 pt-[1.1rem]">
      <Container>
        <div className="flex items-center justify-between gap-8 rounded-card border border-white/10 bg-navy-950/40 px-[1.4rem] py-[0.55rem] backdrop-blur-md">
          <a href="/" aria-label="Semog, página inicial" className="flex shrink-0 items-center">
            {/* biome-ignore lint/performance/noImgElement: sem next/image (localPatterns não cobre /public fora de /api/media) */}
            <img
              src="/semog-logo-light.svg"
              alt="Semog"
              width={140}
              height={22}
              className="h-[22px] w-auto"
            />
          </a>
          <nav aria-label="Principal" className="hidden md:block">
            <ul className="m-0 flex list-none items-center gap-8 p-0">
              {navItems.map((item) => (
                <li key={item.id ?? item.href}>
                  <a
                    href={item.href}
                    className="text-[0.92rem] font-medium text-fg-2 transition-colors duration-200 hover:text-fg"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          {cta.label && cta.href && (
            <Button
              href={cta.href}
              variant="primary"
              size="sm"
              className="hidden shrink-0 md:inline-flex"
            >
              {cta.label}
            </Button>
          )}
        </div>
      </Container>
    </header>
  )
}
