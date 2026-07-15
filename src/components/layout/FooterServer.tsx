import { getPayloadClient } from '@/lib/payload'
import type { Footer } from '@/payload-types'
import { FooterView } from './FooterView'

const DEFAULT_BOTTOM_TEXT = '© 2026 Semog Administradora de Condomínios · Desde 1991'

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
 * Server component do rodapé — busca o global `footer` (com fallback, ver
 * acima) e resolve os dados; `FooterView` (ilha client, `use client`) é quem
 * escolhe o markup (`.footer` completo — `_reference/index.html`/
 * `semog.css:380-422` — ou só `.footer-bottom` nas páginas legais, ver doc
 * do componente) pelo pathname atual. Nunca lança: cai nos fallbacks acima
 * na ausência de DB ou conteúdo.
 */
export async function FooterServer() {
  const footer = await getFooterGlobal()
  const footCta = footer?.footCta?.slogan ? footer.footCta : FALLBACK_FOOT_CTA
  const columns = footer?.columns?.length ? footer.columns : FALLBACK_COLUMNS
  const legalLinks = footer?.legalLinks?.length ? footer.legalLinks : FALLBACK_LEGAL
  const bottomText = footer?.bottomText || DEFAULT_BOTTOM_TEXT

  return (
    <FooterView
      footCta={footCta}
      columns={columns}
      legalLinks={legalLinks}
      bottomText={bottomText}
    />
  )
}
