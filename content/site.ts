/**
 * Global `site-settings` mínimo — só os campos que `getSiteSettings`
 * alimenta hoje (`defaultTitle`/`defaultDescription`/`ogImage`/`social`),
 * usados em `buildMetadata` (`src/lib/seo.ts`) como fallback do `<title>`/
 * descrição quando uma página não tem `meta` próprio.
 *
 * Valores conferidos byte-a-byte contra o global real em produção via
 * `GET /api/globals/site-settings` (dev server local, mesmo DB de prod) em
 * 24/07/2026 — `defaultTitle`/`defaultDescription` batem com
 * `src/seed/globals.ts` (`siteSettingsData`); `ogImage`/`social` nunca foram
 * preenchidos pelo seed nem pelo admin (ambos `null` em produção hoje).
 *
 * Header/Footer/Company completos (navegação, endereços) ficam para a Fase 2
 * — aqui só o global `site-settings`.
 */
export interface SiteConfig {
  defaultTitle: string
  defaultDescription: string
  ogImage?: string | null
  social?: { instagram?: string; linkedin?: string; facebook?: string }
}

export const site: SiteConfig = {
  defaultTitle: 'Semog | Administradora de Condomínios líder do Nordeste há 35 anos',
  defaultDescription:
    'Administradora de condomínios em Recife, João Pessoa, Campina Grande e Belém. 650 condomínios, 70 mil clientes, prestação de contas 100% digital e inadimplência zero com o Semog Garante.',
  ogImage: null,
  social: {},
}
