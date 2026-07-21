import config from '@payload-config'
import { getPayload } from 'payload'
import type { Company, Footer, Header, SiteSettings } from '@/payload-types'

/**
 * Seed idempotente dos Globals (Header, Footer, Company, SiteSettings), com
 * o conteúdo de navegação, rodapé, endereços e SEO padrão espelhando
 * `_reference/index.html` (nav + footer) e as páginas de contato por cidade
 * de `_reference` (que usam dados de endereço/telefone/registro fictícios —
 * placeholders — replicados aqui tal como estão na referência).
 *
 * Executa via `pnpm seed:globals` (`payload run src/seed/globals.ts`): o
 * próprio script obtém a instância do Payload com `getPayload({ config })`,
 * o CLI `payload run` não injeta uma pronta.
 */

const headerData: Omit<Header, 'id' | 'updatedAt' | 'createdAt'> = {
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

// Rodapé fiel a `_reference/index.html`: banda foot-cta (slogan + CTA), grid de
// 4 colunas (a 1ª — marca+blurb — é renderizada pelo FooterServer; aqui vão as
// 3 colunas de links: Institucional, Soluções, Onde estamos) e links legais.
const footerData: Omit<Footer, 'id' | 'updatedAt' | 'createdAt'> = {
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

// Endereços e telefones reais das 4 unidades (fonte: semog.com.br + confirmação
// do cliente, jul/2026). `creci/abadi/secovi` seguem genéricos por ora (sem
// número de registro informado).
const companyData: Omit<Company, 'id' | 'updatedAt' | 'createdAt'> = {
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

const siteSettingsData: Omit<SiteSettings, 'id' | 'updatedAt' | 'createdAt'> = {
  defaultTitle: 'Semog | Administradora de Condomínios líder do Nordeste há 35 anos',
  defaultDescription:
    'Administradora de condomínios em Recife, João Pessoa, Campina Grande e Belém. 700 condomínios, 70 mil clientes, prestação de contas 100% digital e inadimplência zero com o Semog Garante.',
}

async function seedGlobals() {
  const payload = await getPayload({ config })

  await payload.updateGlobal({ slug: 'header', data: headerData })
  console.log('[seed:globals] Global "header" atualizado.')

  await payload.updateGlobal({ slug: 'footer', data: footerData })
  console.log('[seed:globals] Global "footer" atualizado.')

  await payload.updateGlobal({ slug: 'company', data: companyData })
  console.log('[seed:globals] Global "company" atualizado.')

  await payload.updateGlobal({ slug: 'site-settings', data: siteSettingsData })
  console.log('[seed:globals] Global "site-settings" atualizado.')
}

await seedGlobals()
