import { Container } from '@/components/ui/Container'
import { getPayloadClient } from '@/lib/payload'
import type { Footer } from '@/payload-types'

const DEFAULT_BOTTOM_TEXT = '© 2026 Semog Administradora de Condomínios · Desde 1991'

async function getFooterGlobal(): Promise<Footer | null> {
  try {
    const payload = await getPayloadClient()
    const footer = await payload.findGlobal({ slug: 'footer' })
    return footer ?? null
  } catch {
    // Sem banco de dados (ex.: rota /styleguide sem .env) — segue com o fallback.
    return null
  }
}

/**
 * Server component: busca o global `footer` via Local API e nunca lança —
 * na ausência de DB ou de conteúdo cadastrado, cai no fallback mínimo
 * (logo + copyright) para que o layout do frontend siga renderizável.
 */
export async function FooterServer() {
  const footer = await getFooterGlobal()
  const columns = footer?.columns?.length ? footer.columns : null
  const bottomText = footer?.bottomText || DEFAULT_BOTTOM_TEXT

  return (
    <footer className="border-t border-line bg-navy-950">
      <Container className="py-[clamp(3rem,6vw,5rem)]">
        <div
          className={
            columns
              ? 'grid grid-cols-1 gap-10 border-b border-line pb-12 sm:grid-cols-2 lg:grid-cols-4'
              : ''
          }
        >
          <div>
            {/* biome-ignore lint/performance/noImgElement: sem next/image (localPatterns não cobre /public fora de /api/media) */}
            <img
              src="/semog-logo-light.svg"
              alt="Semog"
              width={160}
              height={24}
              className="mb-[1.4rem] h-6 w-auto"
            />
            {!columns && (
              <p className="max-w-[36ch] text-[0.92rem] text-fg-2">
                Administradora de condomínios líder do Nordeste. Desde 1991 cuidando de comunidades
                com transparência, retidão e dinâmica.
              </p>
            )}
          </div>
          {columns?.map((col) => (
            <div key={col.id ?? col.title}>
              <h4 className="mb-4 text-sm font-semibold text-fg">{col.title}</h4>
              <ul className="m-0 flex list-none flex-col gap-[0.7rem] p-0">
                {col.links?.map((link) => (
                  <li key={link.id ?? link.href}>
                    <a
                      href={link.href}
                      className="text-[0.92rem] text-fg-2 transition-colors duration-200 hover:text-accent"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="pt-8 text-[0.85rem] text-fg-3">{bottomText}</p>
      </Container>
    </footer>
  )
}
