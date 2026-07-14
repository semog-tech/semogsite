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

// Endereços, telefones e registros são placeholders — os mesmos valores
// fictícios usados em `_reference` (ex.: "Av. Exemplo", "(81) 0000-0000",
// "CRECI/PE"). Não substituir por dados reais nesta tarefa.
const companyData: Omit<Company, 'id' | 'updatedAt' | 'createdAt'> = {
  addresses: [
    {
      city: 'Recife',
      uf: 'PE',
      address: 'Av. Conselheiro Aguiar, 1000 · Sala 501, Boa Viagem, Recife/PE · CEP 51011-000',
      phone: '(81) 0000-0000',
      creci: 'CRECI/PE',
      abadi: 'ABADI',
      secovi: 'SECOVI',
    },
    {
      city: 'João Pessoa',
      uf: 'PB',
      address: 'Av. Epitácio Pessoa, 500 · Sala 302, Tambaú, João Pessoa/PB · CEP 58039-000',
      phone: '(83) 0000-0000',
      creci: 'CRECI/PB',
      abadi: 'ABADI',
      secovi: 'SECOVI',
    },
    {
      city: 'Campina Grande',
      uf: 'PB',
      address: 'Rua Maciel Pinheiro, 200 · Sala 104, Centro, Campina Grande/PB · CEP 58400-000',
      phone: '(83) 0000-0001',
      creci: 'CRECI/PB',
      abadi: 'ABADI',
      secovi: 'SECOVI',
    },
    {
      city: 'Belém',
      uf: 'PA',
      address: 'Av. Visconde de Souza Franco, 300 · Sala 205, Umarizal, Belém/PA · CEP 66053-000',
      phone: '(91) 0000-0000',
      creci: 'CRECI/PA',
      abadi: 'ABADI',
      secovi: 'SECOVI',
    },
  ],
  // Número da matriz (Recife), usado no botão flutuante de `_reference`.
  whatsapp: '5581999999999',
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
