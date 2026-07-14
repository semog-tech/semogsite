import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { getPayloadClient } from '@/lib/payload'
import type { Footer } from '@/payload-types'

const DEFAULT_BOTTOM_TEXT = '© 2026 Semog Administradora de Condomínios · Desde 1991'

/** Blurb fixo da marca (semog.css: `.footer-brand p`) — texto de `_reference/index.html`. */
const BRAND_BLURB =
  'Administradora de condomínios líder do Nordeste. Desde 1991 cuidando de comunidades com transparência, retidão e dinâmica.'

/**
 * Fallbacks espelhando `_reference/index.html` (footer) — usados quando o
 * global `footer` está vazio ou inacessível (ex.: rota sem banco de dados).
 */
const FALLBACK_FOOT_CTA: NonNullable<Footer['footCta']> = {
  slogan: 'Preocupe-se apenas',
  sloganEm: 'em morar.',
  cta: { label: 'Solicitar proposta', href: '/proposta' },
}

const FALLBACK_COLUMNS: NonNullable<Footer['columns']> = [
  {
    title: 'Institucional',
    links: [
      { label: 'A Semog', href: '/semog' },
      { label: 'Soluções', href: '/solucoes' },
      { label: 'Incorporadoras', href: '/incorporadoras' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contato', href: '/contato' },
    ],
  },
  {
    title: 'Soluções',
    links: [
      { label: 'Administração de condomínios', href: '/administracao-de-condominios' },
      { label: 'Semog Garante', href: '/garante' },
      { label: 'Prestação de contas', href: '/solucoes#prestacao' },
      { label: 'Aplicativo', href: '/solucoes#aplicativo' },
      { label: 'Semog One', href: '/solucoes#tecnologia' },
      { label: 'Benefícios', href: '/solucoes#beneficios' },
    ],
  },
  {
    title: 'Onde estamos',
    links: [
      { label: 'Recife · Matriz', href: '/administradora-de-condominios-recife' },
      { label: 'João Pessoa', href: '/administradora-de-condominios-joao-pessoa' },
      { label: 'Campina Grande', href: '/administradora-de-condominios-campina-grande' },
      { label: 'Belém', href: '/administradora-de-condominios-belem' },
    ],
  },
]

const FALLBACK_LEGAL: NonNullable<Footer['legalLinks']> = [
  { label: 'Privacidade', href: '/privacidade' },
  { label: 'Termos de uso', href: '/termos' },
]

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
 * Server component do rodapé — fiel a `_reference/index.html` e
 * `semog.css:380-422`: banda `.foot-cta` (slogan com `<em>` destacado + CTA),
 * grid de 4 colunas (marca+blurb + 3 colunas de links) e `.footer-bottom`
 * (copyright + links legais em linha). Nunca lança: cai nos fallbacks acima
 * na ausência de DB ou conteúdo.
 */
export async function FooterServer() {
  const footer = await getFooterGlobal()
  const footCta = footer?.footCta?.slogan ? footer.footCta : FALLBACK_FOOT_CTA
  const columns = footer?.columns?.length ? footer.columns : FALLBACK_COLUMNS
  const legalLinks = footer?.legalLinks?.length ? footer.legalLinks : FALLBACK_LEGAL
  const bottomText = footer?.bottomText || DEFAULT_BOTTOM_TEXT
  const cta = footCta?.cta

  return (
    <footer className="footer">
      <Container>
        <div className="foot-cta">
          <p className="slog">
            {footCta?.slogan} <em>{footCta?.sloganEm}</em>
          </p>
          {cta?.label && cta?.href && (
            <Button href={cta.href} variant="white" size="lg" withArrow magnetic>
              {cta.label}
            </Button>
          )}
        </div>

        <div className="footer-grid">
          <div className="footer-brand">
            {/* biome-ignore lint/performance/noImgElement: sem next/image (localPatterns não cobre /public fora de /api/media) */}
            <img src="/semog-logo-light.svg" alt="Semog" width={160} height={24} />
            <p>{BRAND_BLURB}</p>
          </div>
          {columns.map((col) => (
            <div key={col.id ?? col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links?.map((link) => (
                  <li key={link.id ?? link.href}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <span>{bottomText}</span>
          <nav className="legal" aria-label="Legal">
            {legalLinks.map((link) => (
              <a key={link.id ?? link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </Container>
    </footer>
  )
}
