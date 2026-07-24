/**
 * Globais do site (fora do CMS) — `site-settings` (Fase 1, título/descrição
 * padrão) + `header`/`footer`/`company` (Fase 2, Task 1), consumidos pelos
 * três server components de layout (`HeaderServer`/`FooterServer`/
 * `WhatsAppFloat`) no lugar do `findGlobal` do Payload.
 *
 * **Fonte da verdade:** `src/seed/globals.ts` (reflete produção) — os valores
 * abaixo são port fiel (byte-a-byte) de `headerData`/`footerData`/
 * `companyData`/`siteSettingsData` daquele arquivo. `defaultTitle`/
 * `defaultDescription`/`ogImage`/`social` já foram conferidos byte-a-byte
 * contra o global real em produção (ver comentário anterior, 24/07/2026);
 * header/footer/company não têm endpoint público equivalente pra conferir
 * (não são usados em `buildMetadata`), então a checagem aqui é contra o seed.
 */

export interface NavItem {
  label: string
  href: string
}

export interface CtaLink {
  label: string
  href: string
}

export interface HeaderConfig {
  navItems: NavItem[]
  cta: CtaLink
  clientArea: CtaLink
}

export interface FootCta {
  slogan: string
  sloganEm: string
  cta: CtaLink
}

export interface FooterColumn {
  title: string
  links: NavItem[]
}

export interface FooterConfig {
  footCta: FootCta
  columns: FooterColumn[]
  legalLinks: NavItem[]
  bottomText: string
}

export interface CompanyAddress {
  city: string
  uf: string
  address: string
  phone: string
  creci: string
  abadi: string
  secovi: string
}

export interface CompanyConfig {
  addresses: CompanyAddress[]
  whatsapp: string
}

export interface SiteConfig {
  defaultTitle: string
  defaultDescription: string
  ogImage?: string | null
  social?: { instagram?: string; linkedin?: string; facebook?: string }
  header: HeaderConfig
  footer: FooterConfig
  company: CompanyConfig
}

// Port fiel de `headerData` em `src/seed/globals.ts`.
const header: HeaderConfig = {
  navItems: [
    { label: 'A Semog', href: '/semog' },
    { label: 'Soluções', href: '/solucoes' },
    { label: 'Incorporadoras', href: '/incorporadoras' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contato', href: '/contato' },
  ],
  cta: { label: 'Solicitar proposta', href: '/proposta' },
  clientArea: {
    label: 'Área do cliente',
    href: 'https://semog.superlogica.net/clients/areadocondomino',
  },
}

// Port fiel de `footerData` em `src/seed/globals.ts` — rodapé fiel a
// `_reference/index.html`: banda foot-cta (slogan + CTA), grid de 4 colunas
// (a 1ª — marca+blurb — é fixa em `FooterView`; aqui vão as 3 colunas de
// links: Institucional, Soluções, Onde estamos) e links legais.
const footer: FooterConfig = {
  footCta: {
    slogan: 'Preocupe-se apenas',
    sloganEm: 'em morar.',
    cta: { label: 'Solicitar proposta', href: '/proposta' },
  },
  columns: [
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
  ],
  legalLinks: [
    { label: 'Privacidade', href: '/privacidade' },
    { label: 'Termos de uso', href: '/termos' },
  ],
  bottomText: '© 2026 Semog Administradora de Condomínios · Desde 1991',
}

// Port fiel de `companyData` em `src/seed/globals.ts` — endereços e telefones
// reais das 4 unidades; `creci`/`abadi`/`secovi` seguem genéricos (sem número
// de registro informado pelo cliente até jul/2026).
const company: CompanyConfig = {
  addresses: [
    {
      city: 'Recife',
      uf: 'PE',
      address: 'R. Bartolomeu de Gusmão, 217, Madalena, Recife/PE · CEP 50610-190',
      phone: '(81) 3316-0265',
      creci: 'CRECI/PE',
      abadi: 'ABADI',
      secovi: 'SECOVI',
    },
    {
      city: 'João Pessoa',
      uf: 'PB',
      address: 'Av. Guarabira, 834, Manaíra, João Pessoa/PB · CEP 58038-140',
      phone: '(83) 3224-1228',
      creci: 'CRECI/PB',
      abadi: 'ABADI',
      secovi: 'SECOVI',
    },
    {
      city: 'Campina Grande',
      uf: 'PB',
      address: 'R. José Adnoste Roberto, 1001, Catolé, Campina Grande/PB · CEP 58410-193',
      phone: '(83) 3201-9039',
      creci: 'CRECI/PB',
      abadi: 'ABADI',
      secovi: 'SECOVI',
    },
    {
      city: 'Belém',
      uf: 'PA',
      address: 'Av. Alcindo Cacela, 2351 · Sl 201, Cremação, Belém/PA · CEP 66040-273',
      phone: '(91) 3115-4700',
      creci: 'CRECI/PA',
      abadi: 'ABADI',
      secovi: 'SECOVI',
    },
  ],
  // WhatsApp central da Semog (atende todas as unidades), usado no botão flutuante.
  whatsapp: '551130034506',
}

export const site: SiteConfig = {
  defaultTitle: 'Semog | Administradora de Condomínios líder do Nordeste há 35 anos',
  defaultDescription:
    'Administradora de condomínios em Recife, João Pessoa, Campina Grande e Belém. 650 condomínios, 70 mil clientes, prestação de contas 100% digital e inadimplência zero com o Semog Garante.',
  ogImage: null,
  social: {},
  header,
  footer,
  company,
}
