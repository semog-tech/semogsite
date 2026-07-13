import config from '@payload-config'
import { getPayload } from 'payload'
import type {
  AppShowcaseBlock,
  BenefitsBlock,
  CitiesBlock,
  ContactInfoBlock,
  CTABandBlock,
  FaqBlock,
  FeatureGridBlock,
  FormEmbedBlock,
  GaranteBlock,
  HeroBlock,
  Page,
  RegistrosBlock,
  RichTextBlock,
  ShowcaseBlock,
  StatsBlock,
  TestimonialsBlock,
} from '@/payload-types'

/**
 * Seed idempotente de treze páginas de CMS compostas só de blocos já
 * existentes (sem mídia, sem novo blocos):
 *
 * - "Privacidade" e "Termos", fiel ao corpo de `_reference/privacidade.html`
 *   e `_reference/termos.html`: Hero simples (headline + subhead com a data
 *   de "última atualização", sem ctas/video) seguido de um único bloco
 *   RichText com o texto completo — heading `h2` por seção numerada e
 *   listas onde o `_reference` usa `<ul>`.
 * - "A Semog" (slug `semog`), fiel a `_reference/semog.html`: Hero + o
 *   parágrafo-manifesto em RichText + Stats (números da seção manifesto) +
 *   dois FeatureGrid (Valores e Sócios/"empresa humana") + Cities
 *   (expansão geográfica contada na timeline) + CTABand final.
 * - "Soluções" (slug `solucoes`), fiel a `_reference/solucoes.html`: Hero +
 *   FeatureGrid dos três tipos de condomínio atendidos + AppShowcase (seção
 *   do aplicativo) + Garante (seção "Semog Garante") + Registros (faixa de
 *   selos da seção "Por que Semog") + Faq (as 5 perguntas do FAQPage
 *   schema.org do `_reference`) + CTABand final.
 * - "Administração de condomínios" (slug `administracao-de-condominios`),
 *   fiel a `_reference/administracao-de-condominios.html`: Hero + FeatureGrid
 *   (a grade `.svc-grid` de 9 serviços, seção "O que fazemos") + Showcase
 *   (os 4 passos de `.method`/"Como fazemos", terminando na "Transparência
 *   contínua"/prestação de contas digital — `mediaSide: 'left'`) + Faq (as 5
 *   perguntas do FAQPage schema.org, que também cobrem a seção "Quanto
 *   custa") + CTABand final.
 * - "Semog Garante" (slug `garante`), fiel a `_reference/garante.html`: Hero
 *   (vídeo do escudo, sem mídia aqui) + Garante detalhado (os 4 passos de
 *   `.g-how`/"Como funciona" como features, preço "1%" e nota de rodapé,
 *   texto explicando a parceria com a G5 Partners de `.g-partner`) +
 *   Showcase (a comparação antes/depois de `.g-compare`, cada item como par
 *   título do aspecto + frase "Antes: … Com o Garante: …") + Faq (as 4
 *   perguntas do FAQPage schema.org) + CTABand final.
 * - "Incorporadoras" (slug `incorporadoras`), fiel a
 *   `_reference/incorporadoras.html`: Hero + FeatureGrid (os 4 cards de
 *   `.why-grid`/"O que a sua incorporadora ganha") + Showcase (os 5 passos
 *   de `.proc-list`/"Como trabalhamos", com o parágrafo de `.argument` como
 *   texto de apoio, já que a página não tem um bloco dedicado só para essa
 *   seção intermediária) + Registros (versão condensada das `.tags` de cada
 *   passo, como faixa "O que está incluído na implantação") + CTABand
 *   final.
 * - "Contato" (slug `contato`), fiel a `_reference/contato.html`: Hero +
 *   FormEmbed (`formType: 'contato'` — form real de RHF/Zod/Turnstile, Plano
 *   4b Task 5) + ContactInfo (as 4 unidades de `.unit`). O `_reference` não
 *   tem `<form>`, só os atalhos `.quick-grid` (WhatsApp/e-mail/proposta);
 *   este seed troca esses atalhos pelo form de verdade — quem quiser falar
 *   direto ainda tem WhatsApp/telefone nos cards de unidade logo abaixo. A
 *   seção `.selfserve` do `_reference` linka para autoatendimentos
 *   (`href="#"`) que não existem ainda nesta migração, por isso fica de
 *   fora.
 * - "Proposta" (slug `proposta`), fiel a `_reference/proposta.html`: Hero
 *   (o headline/lead da coluna do formulário) + Benefits (os números do
 *   `.trust-stats` — prova social) + FormEmbed (`formType: 'proposta'` —
 *   form real de RHF/Zod/Turnstile, Plano 4b Task 6) + CTABand (WhatsApp
 *   como canal alternativo pra quem prefere falar direto, mesmo espírito do
 *   `ContactInfo` que fica abaixo do form em "Contato").
 * - Quatro landings de cidade (slugs
 *   `administradora-de-condominios-{recife,joao-pessoa,campina-grande,
 *   belem}`), fiéis a `_reference/administradora-de-condominios-*.html`:
 *   as quatro páginas compartilham a mesma composição, montada por
 *   `seedCityLanding`, só variando o conteúdo por cidade — Hero (a tag da
 *   unidade + o headline/lead de `.page-hero`) + FeatureGrid (os 7
 *   serviços de `.svc-rows`, sob o h2 "Gestão feita por quem conhece
 *   <cidade>") + Testimonials (os dois `.depo-card` de "Quem já é Semog em
 *   <cidade>") + Registros (as credenciais de `.creds`/`.badges`) +
 *   ContactInfo (o cartão `.unit-card` da unidade, um item só) + CTABand
 *   final. Ficam de fora, por não fazerem parte da composição desta task:
 *   os números (`.mini-stats`, já cobertos por "A Semog"), os bairros
 *   atendidos (`.hood-pills`), a banda do Semog Garante (`.g-band`, já
 *   coberta pela página "Semog Garante") e o FAQ local (`.faq`).
 *
 * Prova, junto com `home.ts`/`posts.ts`, que a rota catch-all
 * `[[...slug]]` serve qualquer página de CMS por slug.
 *
 * Executa via `pnpm seed:pages` (`payload run src/seed/pages.ts`): assim
 * como os demais seeds, obtém a própria instância do Payload — o CLI
 * `payload run` não injeta uma pronta.
 */

type InlinePart = string | { text: string; href: string }
type Section =
  | { kind: 'p'; parts: InlinePart[] }
  | { kind: 'h2'; text: string }
  | { kind: 'ul'; items: string[] }

function p(text: string): Section {
  return { kind: 'p', parts: [text] }
}

function pWithLink(before: string, linkText: string, href: string, after: string): Section {
  return { kind: 'p', parts: [before, { text: linkText, href }, after] }
}

function h2(text: string): Section {
  return { kind: 'h2', text }
}

function ul(items: string[]): Section {
  return { kind: 'ul', items }
}

function textNode(text: string) {
  return {
    type: 'text',
    format: 0,
    detail: 0,
    mode: 'normal' as const,
    style: '',
    text,
    version: 1,
  }
}

function linkNode(text: string, href: string) {
  return {
    type: 'link',
    format: '' as const,
    direction: 'ltr' as const,
    indent: 0,
    version: 3,
    fields: { linkType: 'custom' as const, url: href, newTab: false },
    children: [textNode(text)],
  }
}

function inlineChildren(parts: InlinePart[]) {
  return parts.map((part) =>
    typeof part === 'string' ? textNode(part) : linkNode(part.text, part.href),
  )
}

function paragraphNode(parts: InlinePart[]) {
  return {
    type: 'paragraph',
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
    children: inlineChildren(parts),
  }
}

function headingNode(text: string) {
  return {
    type: 'heading',
    tag: 'h2' as const,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
    children: [textNode(text)],
  }
}

function listNode(items: string[]) {
  return {
    type: 'list',
    tag: 'ul' as const,
    listType: 'bullet' as const,
    start: 1,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
    children: items.map((text, index) => ({
      type: 'listitem',
      value: index + 1,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
      children: inlineChildren([text]),
    })),
  }
}

// biome-ignore lint/suspicious/noExplicitAny: shape mínimo do AST lexical (root + parágrafos/headings/listas), não vale tipar tudo aqui
function legalRichText(sections: Section[]): any {
  const children = sections.map((section) => {
    if (section.kind === 'h2') return headingNode(section.text)
    if (section.kind === 'ul') return listNode(section.items)
    return paragraphNode(section.parts)
  })

  return {
    root: {
      type: 'root',
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
      children,
    },
  }
}

const UPDATED_AT = 'Última atualização: julho de 2026 · Documento em revisão pelo jurídico da Semog'

const privacidadeHero: Omit<HeroBlock, 'id' | 'blockName'> = {
  blockType: 'hero',
  headline: 'Política de Privacidade',
  subhead: UPDATED_AT,
}

const privacidadeSections: Section[] = [
  p(
    'Esta Política de Privacidade descreve como a Semog Administradora de Condomínios coleta, usa e protege os dados pessoais de síndicos, condôminos, clientes e visitantes deste site, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).',
  ),
  h2('1. Dados que coletamos'),
  ul([
    'Dados de contato fornecidos em formulários (nome, e-mail, telefone, cidade e informações do condomínio);',
    'Dados de navegação (páginas visitadas, dispositivo e cookies essenciais);',
    'Dados necessários à prestação dos serviços de administração condominial.',
  ]),
  h2('2. Como usamos os dados'),
  ul([
    'Responder solicitações de proposta e atendimento;',
    'Prestar os serviços contratados pelo condomínio;',
    'Cumprir obrigações legais, contábeis e regulatórias;',
    'Melhorar a experiência do site e dos nossos canais digitais.',
  ]),
  h2('3. Compartilhamento'),
  p(
    'Não vendemos dados pessoais. Compartilhamos dados apenas com operadores necessários à prestação do serviço (como instituições financeiras, parceiros de cobrança e provedores de tecnologia), sempre sob contrato e dever de confidencialidade.',
  ),
  h2('4. Seus direitos'),
  pWithLink(
    'Você pode solicitar a qualquer momento a confirmação, o acesso, a correção, a anonimização ou a exclusão dos seus dados, além da revogação de consentimentos, pelo e-mail ',
    'privacidade@semog.com.br',
    'mailto:privacidade@semog.com.br',
    '.',
  ),
  h2('5. Segurança e retenção'),
  p(
    'Adotamos medidas técnicas e organizacionais para proteger os dados sob nossa responsabilidade e os mantemos apenas pelo tempo necessário às finalidades desta política ou às exigências legais.',
  ),
  h2('6. Contato do encarregado (DPO)'),
  p(
    'Dúvidas sobre esta política podem ser encaminhadas ao nosso encarregado de proteção de dados pelo e-mail acima.',
  ),
]

const privacidadeRichText: Omit<RichTextBlock, 'id' | 'blockName'> = {
  blockType: 'richText',
  content: legalRichText(privacidadeSections),
}

const termosHero: Omit<HeroBlock, 'id' | 'blockName'> = {
  blockType: 'hero',
  headline: 'Termos de Uso',
  subhead: UPDATED_AT,
}

const termosSections: Section[] = [
  p(
    'Estes Termos de Uso regulam a utilização do site da Semog Administradora de Condomínios. Ao navegar por este site, você concorda com as condições abaixo.',
  ),
  h2('1. Finalidade do site'),
  p(
    'Este site tem caráter informativo e comercial: apresenta os serviços da Semog, permite a solicitação de propostas e o acesso a canais de atendimento e autoatendimento.',
  ),
  h2('2. Uso adequado'),
  ul([
    'É vedado utilizar o site para fins ilícitos ou que violem direitos de terceiros;',
    'É vedado tentar acessar áreas restritas, sistemas ou dados sem autorização;',
    'As informações enviadas em formulários devem ser verdadeiras e atualizadas.',
  ]),
  h2('3. Propriedade intelectual'),
  p(
    'Marca, logotipo, textos, imagens e demais conteúdos deste site pertencem à Semog ou a seus licenciantes e não podem ser reproduzidos sem autorização prévia e expressa.',
  ),
  h2('4. Serviços e propostas'),
  p(
    'As informações do site não constituem oferta vinculante. Condições comerciais, incluindo as do Semog Garante, são formalizadas em proposta e contrato específicos para cada condomínio.',
  ),
  h2('5. Responsabilidades'),
  p(
    'A Semog emprega os melhores esforços para manter as informações precisas e o site disponível, mas não se responsabiliza por indisponibilidades temporárias ou por conteúdos de sites de terceiros eventualmente vinculados.',
  ),
  h2('6. Atualizações destes termos'),
  p(
    'Estes termos podem ser atualizados a qualquer momento. A versão vigente estará sempre publicada nesta página.',
  ),
  h2('7. Foro'),
  p(
    'Fica eleito o foro da comarca de Recife/PE para dirimir eventuais controvérsias decorrentes destes termos.',
  ),
]

const termosRichText: Omit<RichTextBlock, 'id' | 'blockName'> = {
  blockType: 'richText',
  content: legalRichText(termosSections),
}

// ===== "A Semog" (slug `semog`), fiel a `_reference/semog.html` =====

const semogHero: Omit<HeroBlock, 'id' | 'blockName'> = {
  blockType: 'hero',
  eyebrow: 'Desde 1991',
  headline: 'Governança se constrói com tempo.',
  subhead:
    'Nascemos no Recife, crescemos com o Nordeste e nos tornamos referência nacional em administração de condomínios.',
}

const semogManifesto: Omit<RichTextBlock, 'id' | 'blockName'> = {
  blockType: 'richText',
  content: legalRichText([
    p(
      'A Semog existe para que síndicos e moradores nunca precisem entender de contabilidade, jurídico ou manutenção. Esse trabalho é nosso. O de vocês é viver bem.',
    ),
  ]),
}

const semogStats: Omit<StatsBlock, 'id' | 'blockName'> = {
  blockType: 'stats',
  eyebrow: 'Nossa história',
  title: 'De 1991 até aqui.',
  items: [
    { value: 35, label: 'Anos de mercado' },
    { value: 700, prefix: '+', label: 'Condomínios' },
    { value: 70, prefix: '+', suffix: 'mil', label: 'Clientes' },
    { value: 100, prefix: '+', label: 'Colaboradores' },
  ],
}

const semogValores: Omit<FeatureGridBlock, 'id' | 'blockName'> = {
  blockType: 'featureGrid',
  title: 'O que não abrimos mão.',
  features: [
    {
      title: 'Transparência',
      description:
        'Cada centavo do condomínio é rastreável. Prestação de contas aberta, documentos públicos para os condôminos e nada embaixo do tapete.',
    },
    {
      title: 'Retidão',
      description:
        'Fazemos o certo mesmo quando ninguém está olhando. É assim há 35 anos, e é por isso que síndicos renovam com a gente.',
    },
    {
      title: 'Dinâmica',
      description:
        'Condomínio não pode esperar. Respostas rápidas, processos digitais e uma equipe que resolve no primeiro contato.',
    },
  ],
}

const semogSocios: Omit<FeatureGridBlock, 'id' | 'blockName'> = {
  blockType: 'featureGrid',
  eyebrow: 'Empresa humana',
  title: 'Tecnologia na operação. Gente na relação.',
  features: [
    {
      title: 'Canal direto com os sócios',
      description:
        'Sem camadas, sem protocolo, sem "vou verificar e retorno". Quem atende resolve.',
    },
    {
      title: 'Equipes locais de verdade',
      description: 'Cada unidade tem gente da cidade, que conhece a rua, o clima e o jeito de lá.',
    },
    {
      title: 'Relacionamentos de década',
      description: 'Boa parte dos nossos condomínios está conosco há mais de dez anos, e renova.',
    },
  ],
}

const semogCities: Omit<CitiesBlock, 'id' | 'blockName'> = {
  blockType: 'cities',
  eyebrow: 'Presença',
  title: 'Da fundação no Recife à expansão pelo Norte.',
  items: [
    { city: 'Recife', uf: 'PE', role: 'Matriz' },
    { city: 'João Pessoa', uf: 'PB', role: 'Filial' },
    { city: 'Campina Grande', uf: 'PB', role: 'Filial' },
    { city: 'Belém', uf: 'PA', role: 'Filial' },
  ],
}

const semogCtaBand: Omit<CTABandBlock, 'id' | 'blockName'> = {
  blockType: 'ctaBand',
  title: 'Venha conhecer a Semog por dentro.',
  text: 'Converse com a nossa equipe e receba uma proposta sob medida para o seu condomínio.',
  cta: { label: 'Solicitar proposta', href: '/proposta' },
}

// ===== "Soluções" (slug `solucoes`), fiel a `_reference/solucoes.html` =====

const solucoesHero: Omit<HeroBlock, 'id' | 'blockName'> = {
  blockType: 'hero',
  headline: 'Tudo que um condomínio precisa. E o que nenhum outro oferece.',
  subhead:
    'Gestão financeira, contábil, jurídica e de pessoas, com a única prestação de contas 100% digital do mercado e garantia de inadimplência zero.',
}

const solucoesServicos: Omit<FeatureGridBlock, 'id' | 'blockName'> = {
  blockType: 'featureGrid',
  eyebrow: 'Soluções',
  title: 'Administração completa para condomínios residenciais, comerciais e associações.',
  features: [
    {
      title: 'Condomínios Residenciais',
      description:
        'O prédio funciona, o morador nem percebe. Financeiro em dia, funcionários cuidados, manutenção prevista e assembleias organizadas.',
    },
    {
      title: 'Condomínios Comerciais',
      description:
        'Eficiência que valoriza o metro quadrado: rateios impecáveis, relatórios gerenciais e fornecedores sob controle para o conselho aprovar com confiança.',
    },
    {
      title: 'Associações',
      description:
        'Governança para comunidades inteiras. Estruturamos estatutos, contribuições e conselhos para loteamentos, associações de moradores e clubes.',
    },
  ],
}

const solucoesApp: Omit<AppShowcaseBlock, 'id' | 'blockName'> = {
  blockType: 'appShowcase',
  eyebrow: 'Aplicativo',
  title: 'Um aplicativo que o morador usa de verdade.',
  text: 'Nada de portal que ninguém acessa. O app da Semog concentra o dia a dia do condomínio em uma interface simples, no bolso de cada morador.',
  features: [
    { title: 'Boletos e segunda via', description: 'Histórico completo e pagamento na hora.' },
    { title: 'Reservas', description: 'Salão de festas, churrasqueira e quadra.' },
    { title: 'Assembleias e votações', description: 'Participação e voto de onde estiver.' },
    { title: 'Avisos', description: 'Comunicados da administração em tempo real.' },
    { title: 'Ocorrências', description: 'Registro e acompanhamento transparente.' },
    { title: 'Documentos', description: 'Convenção, atas e regulamentos sempre à mão.' },
  ],
}

const solucoesGarante: Omit<GaranteBlock, 'id' | 'blockName'> = {
  blockType: 'garante',
  eyebrow: 'Semog Garante',
  title: 'Inadimplência zero.',
  text: 'O único produto do mercado que garante 100% da arrecadação do condomínio, todos os meses. Uma parceria Semog + G5 Partners.',
  features: [
    {
      title: 'O condomínio recebe tudo',
      description: 'Todo mês, 100% da arrecadação prevista entra no caixa, com ou sem atrasos.',
    },
    {
      title: 'A cobrança vira problema nosso',
      description:
        'A Semog e a G5 Partners assumem a negociação com condôminos em atraso, com respeito e dentro da lei.',
    },
    {
      title: 'O orçamento vira certeza',
      description:
        'Sem buracos no fluxo de caixa: obras, manutenção e melhorias saem do papel no prazo.',
    },
    {
      title: 'O síndico dorme tranquilo',
      description:
        'Sem constrangimento com vizinhos e sem assembleia tensa por causa de devedores.',
    },
  ],
  cta: { label: 'Solicitar proposta', href: '/proposta' },
  note: '1% da arrecadação. Sem taxa de adesão, sem letra miúda.',
}

const solucoesRegistros: Omit<RegistrosBlock, 'id' | 'blockName'> = {
  blockType: 'registros',
  title: 'O que muda quando a Semog assume.',
  items: [
    { label: 'Resposta em 24h' },
    { label: 'Acesso direto aos sócios' },
    { label: '35 anos de mercado' },
    { label: 'Equipes locais em 4 cidades' },
    { label: '100% digital' },
  ],
}

const solucoesFaq: Omit<FaqBlock, 'id' | 'blockName'> = {
  blockType: 'faq',
  title: 'Perguntas frequentes.',
  items: [
    {
      question: 'O que a Semog administra?',
      answer:
        'Condomínios residenciais, condomínios comerciais e associações de moradores ou loteamentos. A gestão cobre financeiro, contabilidade, jurídico, pessoal, assembleias, manutenção e seguros.',
    },
    {
      question: 'Como funciona o Semog Garante?',
      answer:
        'Em parceria com a G5 Partners, garantimos 100% da arrecadação prevista do condomínio, todos os meses, mesmo com condôminos em atraso. A cobrança fica por nossa conta e o custo é de 1% da arrecadação.',
    },
    {
      question: 'Como funciona a prestação de contas digital?',
      answer:
        'É 100% digital: cada lançamento traz documentos e comprovantes anexados, os números viram gráficos fáceis de ler e a aprovação acontece com assinatura digital de validade jurídica. Qualquer condômino consulta a qualquer hora.',
    },
    {
      question: 'Em quais cidades a Semog atua?',
      answer:
        'Matriz em Recife (PE) e filiais em João Pessoa (PB), Campina Grande (PB) e Belém (PA), com equipes locais em cada unidade.',
    },
    {
      question: 'Como migrar meu condomínio para a Semog?',
      answer:
        'Nossa equipe conduz a transição de ponta a ponta: auditoria de documentos, comunicação aos condôminos e migração dos dados, sem interromper a operação do condomínio.',
    },
  ],
}

const solucoesCtaBand: Omit<CTABandBlock, 'id' | 'blockName'> = {
  blockType: 'ctaBand',
  title: 'Pronto para uma gestão sem surpresas?',
  text: 'Conte como é o seu condomínio e receba uma proposta em até 24 horas úteis.',
  cta: { label: 'Solicitar proposta', href: '/proposta' },
}

// ===== "Administração de condomínios" (slug `administracao-de-condominios`),
// fiel a `_reference/administracao-de-condominios.html` =====

const administracaoHero: Omit<HeroBlock, 'id' | 'blockName'> = {
  blockType: 'hero',
  eyebrow: 'O serviço principal da Semog',
  headline: 'Administração de condomínios, por inteiro.',
  subhead:
    'Do boleto à assembleia, assumimos a operação para o síndico decidir com tranquilidade e o morador só morar.',
  ctas: [{ label: 'Solicitar proposta', href: '/proposta', variant: 'white' }],
}

const administracaoServicos: Omit<FeatureGridBlock, 'id' | 'blockName'> = {
  blockType: 'featureGrid',
  eyebrow: 'O que fazemos',
  title: 'Tudo que o condomínio precisa, em um só contrato.',
  features: [
    {
      title: 'Gestão financeira',
      description:
        'Boletos, contas a pagar, fluxo de caixa, previsão orçamentária e fundo de reserva sob controle.',
    },
    {
      title: 'Cobrança e inadimplência',
      description:
        'Régua de cobrança profissional e, com o Semog Garante, receita 100% assegurada em contrato.',
    },
    {
      title: 'Contabilidade e prestação de contas',
      description:
        'Balancetes, obrigações fiscais e a única prestação de contas 100% digital do mercado.',
    },
    {
      title: 'Departamento pessoal',
      description:
        'Folha, férias, encargos e rotinas trabalhistas dos funcionários do condomínio, sem risco para o síndico.',
    },
    {
      title: 'Jurídico condominial',
      description:
        'Convenção, regimento, notificações, acordos e suporte em conflitos, com advogados especializados.',
    },
    {
      title: 'Assembleias',
      description:
        'Convocação, condução, ata e votação digital pelo aplicativo, presencial ou online.',
    },
    {
      title: 'Manutenção e fornecedores',
      description:
        'Preventivas, orçamentos comparados e rede homologada com preço de escala de 700 condomínios.',
    },
    {
      title: 'Seguros obrigatórios',
      description: 'Cotação, contratação e renovação do seguro condominial em condições especiais.',
    },
    {
      title: 'Atendimento e comunicação',
      description:
        'Canal direto com síndicos e moradores: aplicativo, WhatsApp e o chatbot pioneiro do setor.',
    },
  ],
}

const administracaoMetodo: Omit<ShowcaseBlock, 'id' | 'blockName'> = {
  blockType: 'showcase',
  eyebrow: 'Como fazemos',
  title: 'Da migração à transparência contínua.',
  text: 'Diagnóstico, migração sem ruptura e operação com método — terminando na prestação de contas digital aberta a qualquer condômino.',
  features: [
    {
      title: 'Diagnóstico e proposta',
      description:
        'Entendemos o momento do condomínio: inadimplência, contratos, pendências e prioridades. A proposta chega em até 24 horas úteis, com escopo claro.',
    },
    {
      title: 'Migração sem ruptura',
      description:
        'Auditoria e transferência de documentos, comunicação aos condôminos e cadastro completo no Semog One, sem interromper a operação.',
    },
    {
      title: 'Operação com método',
      description:
        'Rotinas financeiras, DP, manutenção e atendimento rodando no nosso ERP, com prazos definidos e indicadores acompanhados pela diretoria.',
    },
    {
      title: 'Transparência contínua',
      description:
        'Prestação de contas digital aberta a qualquer condômino, relatórios mensais ao conselho e acesso direto aos sócios quando precisar.',
    },
  ],
  cta: { label: 'Solicitar proposta', href: '/proposta' },
  mediaSide: 'left',
}

const administracaoFaq: Omit<FaqBlock, 'id' | 'blockName'> = {
  blockType: 'faq',
  title: 'Perguntas frequentes.',
  items: [
    {
      question: 'O que faz uma administradora de condomínios?',
      answer:
        'Ela assume a operação do condomínio: finanças e cobrança, contabilidade e prestação de contas, departamento pessoal, jurídico, assembleias, fornecedores, manutenção e seguros. O síndico continua decidindo; a administradora executa com método e responde por prazos.',
    },
    {
      question: 'Quanto custa contratar?',
      answer:
        'Depende do porte e do escopo. A Semog envia proposta personalizada em até 24 horas úteis, sem compromisso, com tudo discriminado: taxa de administração, serviços incluídos e opcionais como o Semog Garante.',
    },
    {
      question: 'Como escolher a administradora certa?',
      answer:
        'Compare tempo de mercado, carteira de condomínios, transparência da prestação de contas, tecnologia para o morador e estrutura de cobrança. Visite a sede, converse com clientes atuais e peça uma proposta detalhada por escrito.',
    },
    {
      question: 'Trocar de administradora dá trabalho?',
      answer:
        'Com condução profissional, não. Aprovada a troca em assembleia, a Semog cuida de toda a migração: documentos, comunicação aos moradores e transição financeira, sem interromper boletos nem pagamentos.',
    },
    {
      question: 'A Semog atende meu tipo de condomínio?',
      answer:
        'Atendemos condomínios residenciais, comerciais, mistos e associações de moradores, em Recife, João Pessoa, Campina Grande, Belém e regiões. Para incorporadoras, implantamos o condomínio da planta à primeira assembleia.',
    },
  ],
}

const administracaoCtaBand: Omit<CTABandBlock, 'id' | 'blockName'> = {
  blockType: 'ctaBand',
  title: 'Seu condomínio administrado pela líder.',
  text: 'Conte como é o seu condomínio e receba uma proposta sob medida em até 24 horas úteis.',
  cta: { label: 'Solicitar proposta', href: '/proposta' },
}

// ===== "Semog Garante" (slug `garante`), fiel a `_reference/garante.html` =====

const garanteHero: Omit<HeroBlock, 'id' | 'blockName'> = {
  blockType: 'hero',
  eyebrow: 'Semog Garante · uma parceria Semog + G5 Partners',
  headline: 'Inadimplência zero.',
  subhead:
    'O condomínio recebe 100% da arrecadação prevista, todos os meses. Chova, atrase quem atrasar.',
  ctas: [{ label: 'Solicitar proposta', href: '/proposta', variant: 'white' }],
}

const garanteDetalhado: Omit<GaranteBlock, 'id' | 'blockName'> = {
  blockType: 'garante',
  eyebrow: 'Como funciona',
  title: '1% da arrecadação. Só isso.',
  text: 'Operado em parceria com a G5 Partners, especialista em soluções financeiras para o mercado condominial: a Semog cuida da gestão e do relacionamento, a G5 da estrutura de capital que assegura o repasse integral. Um contrato só, um parceiro só.',
  features: [
    {
      title: 'O condomínio recebe tudo',
      description:
        'No dia previsto, 100% da arrecadação entra no caixa do condomínio. Com ou sem atrasos, a receita está garantida em contrato.',
    },
    {
      title: 'A cobrança vira problema nosso',
      description:
        'A Semog e a G5 Partners assumem toda a régua de cobrança: negociação humana, dentro da lei e sem constrangimento entre vizinhos.',
    },
    {
      title: 'O orçamento vira certeza',
      description:
        'Sem buraco no fluxo de caixa, manutenção, obras e melhorias saem do papel no prazo combinado em assembleia.',
    },
    {
      title: 'O síndico dorme tranquilo',
      description:
        'Nada de lista de devedores na porta do elevador nem assembleia tensa. A relação entre vizinhos fica preservada.',
    },
  ],
  cta: { label: 'Solicitar proposta', href: '/proposta' },
  note: 'Sem taxa de adesão, sem carência escondida, sem pegadinha no contrato.',
}

const garanteDiferenca: Omit<ShowcaseBlock, 'id' | 'blockName'> = {
  blockType: 'showcase',
  eyebrow: 'A diferença no dia a dia',
  title: 'O que muda com o Semog Garante.',
  text: 'Todo síndico conhece o ciclo: inadimplência sobe, o caixa aperta, a obra para, a assembleia esquenta. O Garante quebra esse ciclo no primeiro mês.',
  features: [
    {
      title: 'Receita',
      description:
        'Antes: imprevisível, refém dos atrasos do mês. Com o Garante: 100% da arrecadação garantida em contrato.',
    },
    {
      title: 'Cobrança',
      description:
        'Antes: o síndico cobra o vizinho, com constrangimento. Com o Garante: cobrança profissional, sem envolver o síndico.',
    },
    {
      title: 'Obras e manutenção',
      description: 'Antes: adiadas por falta de caixa. Com o Garante: dentro do cronograma.',
    },
    {
      title: 'Rateio',
      description:
        'Antes: rateio extra para cobrir buracos. Com o Garante: zero rateio extra por inadimplência.',
    },
    {
      title: 'Assembleias',
      description:
        'Antes: dominadas pela pauta da inadimplência. Com o Garante: para decidir o futuro, não o débito.',
    },
  ],
  cta: { label: 'Solicitar proposta', href: '/proposta' },
  mediaSide: 'right',
}

const garanteFaq: Omit<FaqBlock, 'id' | 'blockName'> = {
  blockType: 'faq',
  title: 'Perguntas diretas, respostas diretas.',
  items: [
    {
      question: 'O que é o Semog Garante?',
      answer:
        'É o produto que garante 100% da arrecadação prevista do condomínio, todos os meses, mesmo com condôminos em atraso. Uma parceria da Semog com a G5 Partners, por 1% da arrecadação.',
    },
    {
      question: 'Quanto custa?',
      answer: '1% da arrecadação mensal. Sem taxa de adesão e sem carência escondida.',
    },
    {
      question: 'Quem cobra os condôminos em atraso?',
      answer:
        'A Semog e a G5 Partners assumem toda a cobrança, com respeito e dentro da lei. O síndico não participa e a convivência entre vizinhos fica preservada.',
    },
    {
      question: 'Meu condomínio precisa ser administrado pela Semog?',
      answer:
        'Sim, o Garante é exclusivo para condomínios Semog. Se o seu ainda não é, a migração é conduzida pela nossa equipe sem interromper a operação, e o Garante já pode entrar no primeiro mês.',
    },
  ],
}

const garanteCtaBand: Omit<CTABandBlock, 'id' | 'blockName'> = {
  blockType: 'ctaBand',
  title: 'Quanto vale nunca mais se preocupar com a arrecadação?',
  text: 'Envie os dados do condomínio e receba a simulação do Garante em até 24 horas úteis.',
  cta: { label: 'Solicitar proposta', href: '/proposta' },
}

// ===== "Incorporadoras" (slug `incorporadoras`), fiel a
// `_reference/incorporadoras.html` =====

const incorporadorasHero: Omit<HeroBlock, 'id' | 'blockName'> = {
  blockType: 'hero',
  headline: 'O condomínio nasce bem antes das chaves.',
  subhead:
    'A Semog implanta o condomínio da sua incorporadora da planta à primeira assembleia, protegendo a entrega, o cliente e a sua marca.',
  ctas: [{ label: 'Solicitar proposta', href: '/proposta' }],
}

const incorporadorasGanhos: Omit<FeatureGridBlock, 'id' | 'blockName'> = {
  blockType: 'featureGrid',
  title: 'O que a sua incorporadora ganha.',
  features: [
    {
      title: 'Reputação protegida',
      description:
        'Condomínio bem implantado significa comprador satisfeito falando bem do empreendimento nas redes e para amigos. O melhor marketing do próximo lançamento.',
    },
    {
      title: 'Time liberado para construir',
      description:
        'Sua equipe de engenharia e relacionamento para de responder sobre taxa de condomínio e volta a fazer o que sabe: entregar obra.',
    },
    {
      title: 'Números desde o dia zero',
      description:
        'Previsão orçamentária auditável e prestação de contas digital desde a instalação. O conselho do condomínio nasce confiando na gestão.',
    },
    {
      title: 'Um parceiro em quatro praças',
      description:
        'Lançou em Recife, João Pessoa, Campina Grande ou Belém? A mesma Semog implanta, com equipe local e padrão único de qualidade.',
    },
  ],
}

const incorporadorasProcesso: Omit<ShowcaseBlock, 'id' | 'blockName'> = {
  blockType: 'showcase',
  eyebrow: 'Como trabalhamos',
  title: 'Da planta à primeira assembleia.',
  text: 'A experiência do comprador não termina na escritura: os primeiros doze meses do condomínio definem como a sua marca será lembrada. Com 35 anos de implantações, a Semog garante que a vida no empreendimento comece tão bem quanto a obra terminou.',
  features: [
    {
      title: 'Previsão orçamentária ainda na planta',
      description:
        'Calculamos a taxa condominial realista antes do lançamento, evitando a armadilha da taxa promocional que explode no segundo ano. Sua equipe de vendas divulga um número que se sustenta.',
    },
    {
      title: 'Convenção e regimento sob medida',
      description:
        'Elaboramos convenção, regimento interno e estrutura jurídica adequados ao perfil do empreendimento, prontos para registro e alinhados ao memorial de incorporação.',
    },
    {
      title: 'Assembleia de instalação conduzida',
      description:
        'Organizamos e conduzimos a assembleia que dá vida jurídica ao condomínio: eleição do síndico, aprovação da previsão e posse da administração, sem tumulto e com ata impecável.',
    },
    {
      title: 'Entrega das unidades organizada',
      description:
        'Estruturamos o calendário de vistorias e entrega de chaves junto à sua equipe, com contratação de pessoal, implantação de portaria e áreas comuns operando desde o primeiro morador.',
    },
    {
      title: 'Pós-obra sem atrito',
      description:
        'Fazemos a ponte entre condomínio e construtora na fase de garantias: chamados técnicos documentados, prazos monitorados e comunicação que evita o desgaste público da sua marca.',
    },
  ],
  cta: { label: 'Solicitar proposta', href: '/proposta' },
}

const incorporadorasRegistros: Omit<RegistrosBlock, 'id' | 'blockName'> = {
  blockType: 'registros',
  title: 'O que está incluído na implantação.',
  items: [
    { label: 'Estudo de custos e benchmark regional' },
    { label: 'Assessoria jurídica e registro em cartório' },
    { label: 'Condução profissional de assembleia' },
    { label: 'Implantação de equipe e portaria' },
    { label: 'Gestão de garantias pós-obra' },
  ],
}

const incorporadorasCtaBand: Omit<CTABandBlock, 'id' | 'blockName'> = {
  blockType: 'ctaBand',
  title: 'Tem lançamento no radar?',
  text: 'Envolva a Semog ainda na planta e lance com a taxa certa, a convenção certa e a operação pronta.',
  cta: { label: 'Solicitar proposta', href: '/proposta' },
}

// ===== "Contato" (slug `contato`), fiel a `_reference/contato.html` =====
//
// NOTA: `_reference/contato.html` não tem `<form>` — só atalhos (WhatsApp,
// e-mail, link de proposta) e cards de unidade. O form de verdade (RHF/Zod/
// Turnstile, `formType: 'contato'`) é a Task 5 do Plano 4b — ver
// `src/components/forms/ContactForm.tsx` e `src/blocks/FormEmbed`.

const contatoHero: Omit<HeroBlock, 'id' | 'blockName'> = {
  blockType: 'hero',
  headline: 'Fale com gente que resolve.',
  subhead: 'Atendimento rápido nos canais digitais e quatro unidades de portas abertas.',
}

const contatoFormEmbed: Omit<FormEmbedBlock, 'id' | 'blockName'> = {
  blockType: 'formEmbed',
  formType: 'contato',
  eyebrow: 'Fale com a gente',
  title: 'Envie sua mensagem.',
  text: 'Preencha o formulário e nossa equipe responde em horário comercial, geralmente em poucos minutos.',
}

const contatoUnidades: Omit<ContactInfoBlock, 'id' | 'blockName'> = {
  blockType: 'contactInfo',
  eyebrow: 'Unidades',
  title: 'As Semogs, de portas abertas.',
  items: [
    {
      city: 'Recife',
      uf: 'PE · Matriz',
      address: 'Av. Exemplo, 1000, Boa Viagem, Recife/PE',
      phone: '(81) 0000-0000',
    },
    {
      city: 'João Pessoa',
      uf: 'PB · Filial',
      address: 'Av. Exemplo, 200, Manaíra, João Pessoa/PB',
      phone: '(83) 0000-0000',
    },
    {
      city: 'Campina Grande',
      uf: 'PB · Filial',
      address: 'Rua Exemplo, 300, Centro, Campina Grande/PB',
      phone: '(83) 0000-0001',
    },
    {
      city: 'Belém',
      uf: 'PA · Filial',
      address: 'Av. Exemplo, 400, Umarizal, Belém/PA',
      phone: '(91) 0000-0000',
    },
  ],
  whatsapp: '5581999999999',
}

// ===== "Proposta" (slug `proposta`), fiel a `_reference/proposta.html` =====
//
// NOTA: `_reference/proposta.html` tem um `<form id="prop-form">` com
// validação e "sucesso" só em JS de página estática (sem submit real para
// nenhum backend). O form de verdade (RHF/Zod/Turnstile, `formType:
// 'proposta'`) é a Task 6 do Plano 4b — ver `src/components/forms/PropostaForm.tsx`
// e `src/blocks/FormEmbed`.

const propostaHero: Omit<HeroBlock, 'id' | 'blockName'> = {
  blockType: 'hero',
  headline: 'Vamos falar do seu condomínio?',
  subhead: 'Preencha em dois minutos. Nossa equipe comercial responde em até 24 horas úteis.',
}

const propostaProvaSocial: Omit<BenefitsBlock, 'id' | 'blockName'> = {
  blockType: 'benefits',
  eyebrow: 'Por que pedir à Semog',
  title: 'Números que sustentam a proposta.',
  items: [
    {
      title: '35 anos de mercado',
      description: 'Trajetória consolidada desde 1991, com renovação constante de contratos.',
    },
    {
      title: '+700 condomínios',
      description: 'Carteira ativa em Recife, João Pessoa, Campina Grande e Belém.',
    },
    {
      title: '+70 mil clientes',
      description: 'Síndicos, conselheiros e moradores atendidos todos os dias.',
    },
    {
      title: '4 unidades na região',
      description: 'Equipes locais em cada praça, prontas para atender o seu condomínio.',
    },
  ],
}

const propostaFormEmbed: Omit<FormEmbedBlock, 'id' | 'blockName'> = {
  blockType: 'formEmbed',
  formType: 'proposta',
  eyebrow: 'Solicitar proposta',
  title: 'Conte sobre o seu condomínio.',
  text: 'Preencha os dados abaixo e a nossa equipe comercial responde em até 24 horas úteis, pelo WhatsApp ou e-mail informado.',
}

const propostaCtaBand: Omit<CTABandBlock, 'id' | 'blockName'> = {
  blockType: 'ctaBand',
  title: 'Pronto para receber a sua proposta?',
  text: 'Fale agora com a Semog e receba uma proposta sob medida para o seu condomínio.',
  cta: { label: 'Falar no WhatsApp', href: 'https://wa.me/5581999999999' },
}

async function upsertPage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  args: { title: string; slug: string; layout: NonNullable<Page['layout']> },
) {
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: args.slug } },
    limit: 1,
    depth: 0,
  })

  const data = {
    title: args.title,
    slug: args.slug,
    _status: 'published' as const,
    layout: args.layout,
  }

  if (existing.docs[0]) {
    const updated = await payload.update({
      collection: 'pages',
      id: existing.docs[0].id,
      data,
    })
    console.log(`[seed:pages] Página "${args.slug}" atualizada (id=${updated.id}).`)
  } else {
    const created = await payload.create({
      collection: 'pages',
      data,
    })
    console.log(`[seed:pages] Página "${args.slug}" criada (id=${created.id}).`)
  }
}

// ===== Landings de cidade (Recife, João Pessoa, Campina Grande, Belém),
// fiéis a `_reference/administradora-de-condominios-*.html` =====

type CityLandingTestimonial = { quote: string; author: string; role: string }

type CityLandingInput = {
  slug: string
  city: string
  role: 'Matriz' | 'Filial'
  uf: string
  ufFull: string
  heroSubhead: string
  neighborhood: string
  address: string
  phone: string
  whatsapp: string
  testimonials: [CityLandingTestimonial, CityLandingTestimonial]
}

// Os 7 itens de `.svc-rows` são idênticos nas quatro páginas do
// `_reference` — só o parágrafo de apresentação acima muda por cidade, e
// esse parágrafo não tem um campo correspondente no FeatureGrid (que só
// tem eyebrow/title + cards), então vira só o `title` do bloco.
const cityServicos: NonNullable<FeatureGridBlock['features']> = [
  {
    title: 'Gestão financeira e cobrança',
    description:
      'Boletos, contas a pagar e fluxo de caixa sob controle, com régua de cobrança profissional.',
  },
  {
    title: 'Prestação de contas 100% digital',
    description:
      'Documentos anexados a cada lançamento e aprovação por assinatura digital — exclusiva no mercado.',
  },
  {
    title: 'Folha e RH dos funcionários',
    description:
      'Folha, férias, encargos e rotinas trabalhistas do condomínio, sem risco para o síndico.',
  },
  {
    title: 'Assessoria jurídica condominial',
    description:
      'Convenção, regimento, notificações e suporte em conflitos, com advogados especializados.',
  },
  {
    title: 'Assembleias presenciais e digitais',
    description:
      'Convocação, condução, ata e votação pelo aplicativo, no formato que o condomínio escolher.',
  },
  {
    title: 'Aplicativo para moradores e síndicos',
    description: 'Boletos, reservas, avisos e ocorrências, tudo no bolso do morador e do síndico.',
  },
  {
    title: 'Semog Garante: inadimplência zero',
    description: '1% da arrecadação garante 100% do caixa do condomínio, todos os meses.',
  },
]

async function seedCityLanding(
  payload: Awaited<ReturnType<typeof getPayload>>,
  input: CityLandingInput,
) {
  const hero: Omit<HeroBlock, 'id' | 'blockName'> = {
    blockType: 'hero',
    eyebrow: `Semog ${input.city} · ${input.role} · ${input.ufFull}`,
    headline: `Administradora de condomínios em ${input.city}.`,
    subhead: input.heroSubhead,
    ctas: [{ label: 'Solicitar proposta', href: '/proposta', variant: 'white' }],
  }

  const servicos: Omit<FeatureGridBlock, 'id' | 'blockName'> = {
    blockType: 'featureGrid',
    title: `Gestão feita por quem conhece ${input.city}.`,
    features: cityServicos,
  }

  const depoimentos: Omit<TestimonialsBlock, 'id' | 'blockName'> = {
    blockType: 'testimonials',
    eyebrow: `Quem já é Semog em ${input.city}`,
    items: input.testimonials,
  }

  const registros: Omit<RegistrosBlock, 'id' | 'blockName'> = {
    blockType: 'registros',
    title:
      'A Semog é registrada nos órgãos do setor e associada às entidades do mercado condominial. Documentação disponível para consulta na unidade.',
    items: [
      { label: `CRECI/${input.uf}` },
      { label: 'ABADI' },
      { label: 'SECOVI' },
      { label: 'Desde 1991' },
    ],
  }

  const contactInfo: Omit<ContactInfoBlock, 'id' | 'blockName'> = {
    blockType: 'contactInfo',
    eyebrow: `Nossa unidade em ${input.city}`,
    title: `De portas abertas em ${input.neighborhood}.`,
    items: [
      {
        city: input.city,
        uf: `${input.uf} · ${input.role}`,
        address: input.address,
        phone: input.phone,
      },
    ],
    whatsapp: input.whatsapp,
  }

  const ctaBand: Omit<CTABandBlock, 'id' | 'blockName'> = {
    blockType: 'ctaBand',
    title: `Seu condomínio em ${input.city} merece a líder.`,
    text: `Fale com a Semog ${input.city} e receba uma proposta sob medida em até 24 horas úteis.`,
    cta: { label: 'Solicitar proposta', href: '/proposta' },
  }

  await upsertPage(payload, {
    title: `Administradora de Condomínios em ${input.city}`,
    slug: input.slug,
    layout: [hero, servicos, depoimentos, registros, contactInfo, ctaBand],
  })
}

const recifeCityLanding: CityLandingInput = {
  slug: 'administradora-de-condominios-recife',
  city: 'Recife',
  role: 'Matriz',
  uf: 'PE',
  ufFull: 'Pernambuco',
  heroSubhead:
    'A líder do Nordeste nasceu aqui. Matriz em Recife, 35 anos de mercado e mais de 700 condomínios sob gestão.',
  neighborhood: 'Boa Viagem',
  address: 'Av. Conselheiro Aguiar, 1000 · Sala 501, Boa Viagem · Recife/PE · CEP 51011-000',
  phone: '(81) 0000-0000',
  whatsapp: '5581999999999',
  testimonials: [
    {
      quote:
        'Trocamos de administradora depois de anos de balancete confuso. Com a prestação de contas digital, a assembleia aprova as contas em minutos.',
      author: 'Síndico de condomínio residencial',
      role: 'Boa Viagem',
    },
    {
      quote: 'O Semog Garante mudou o caixa do prédio. A obra da fachada saiu sem rateio extra.',
      author: 'Síndica profissional',
      role: 'Zona Sul do Recife',
    },
  ],
}

const joaoPessoaCityLanding: CityLandingInput = {
  slug: 'administradora-de-condominios-joao-pessoa',
  city: 'João Pessoa',
  role: 'Filial',
  uf: 'PB',
  ufFull: 'Paraíba',
  heroSubhead:
    'A administradora líder do Nordeste, com filial e equipe local em João Pessoa para cuidar do seu condomínio de perto.',
  neighborhood: 'Tambaú',
  address: 'Av. Epitácio Pessoa, 500 · Sala 302, Tambaú · João Pessoa/PB · CEP 58039-000',
  phone: '(83) 0000-0000',
  whatsapp: '5583999999999',
  testimonials: [
    {
      quote:
        'A equipe daqui conhece cada prédio da orla. Resolvem antes de virar problema em assembleia.',
      author: 'Síndico de condomínio',
      role: 'Manaíra',
    },
    {
      quote: 'Migramos sem nenhum boleto atrasado no meio do caminho. Transição impecável.',
      author: 'Conselheira fiscal',
      role: 'Cabo Branco',
    },
  ],
}

const campinaGrandeCityLanding: CityLandingInput = {
  slug: 'administradora-de-condominios-campina-grande',
  city: 'Campina Grande',
  role: 'Filial',
  uf: 'PB',
  ufFull: 'Paraíba',
  heroSubhead:
    'A administradora líder do Nordeste, com filial e equipe local em Campina Grande para cuidar do seu condomínio de perto.',
  neighborhood: 'Centro',
  address: 'Rua Maciel Pinheiro, 200 · Sala 104, Centro · Campina Grande/PB · CEP 58400-000',
  phone: '(83) 0000-0000',
  whatsapp: '5583999999999',
  testimonials: [
    {
      quote:
        'Condomínio de 40 unidades tratado com a mesma seriedade dos grandes. Isso fez a diferença.',
      author: 'Síndico de condomínio',
      role: 'Catolé',
    },
    {
      quote: 'A prestação de contas digital acabou com a desconfiança nas assembleias.',
      author: 'Moradora e conselheira',
      role: 'Alto Branco',
    },
  ],
}

const belemCityLanding: CityLandingInput = {
  slug: 'administradora-de-condominios-belem',
  city: 'Belém',
  role: 'Filial',
  uf: 'PA',
  ufFull: 'Pará',
  heroSubhead:
    'O método da líder do Nordeste, com filial e equipe local em Belém do Pará para cuidar do seu condomínio de perto.',
  neighborhood: 'Umarizal',
  address: 'Av. Visconde de Souza Franco, 300 · Sala 205, Umarizal · Belém/PA · CEP 66053-000',
  phone: '(91) 0000-0000',
  whatsapp: '5591999999999',
  testimonials: [
    {
      quote: 'Primeira administradora que respondeu chamado de manutenção no mesmo dia.',
      author: 'Síndico de condomínio',
      role: 'Umarizal',
    },
    {
      quote: 'O app facilitou demais: boleto, reserva do salão e assembleia, tudo no celular.',
      author: 'Morador e subsíndico',
      role: 'Nazaré',
    },
  ],
}

async function seedPages() {
  const payload = await getPayload({ config })

  await upsertPage(payload, {
    title: 'Política de Privacidade',
    slug: 'privacidade',
    layout: [privacidadeHero, privacidadeRichText],
  })

  await upsertPage(payload, {
    title: 'Termos de Uso',
    slug: 'termos',
    layout: [termosHero, termosRichText],
  })

  await upsertPage(payload, {
    title: 'A Semog',
    slug: 'semog',
    layout: [
      semogHero,
      semogManifesto,
      semogStats,
      semogValores,
      semogSocios,
      semogCities,
      semogCtaBand,
    ],
  })

  await upsertPage(payload, {
    title: 'Soluções',
    slug: 'solucoes',
    layout: [
      solucoesHero,
      solucoesServicos,
      solucoesApp,
      solucoesGarante,
      solucoesRegistros,
      solucoesFaq,
      solucoesCtaBand,
    ],
  })

  await upsertPage(payload, {
    title: 'Administração de condomínios',
    slug: 'administracao-de-condominios',
    layout: [
      administracaoHero,
      administracaoServicos,
      administracaoMetodo,
      administracaoFaq,
      administracaoCtaBand,
    ],
  })

  await upsertPage(payload, {
    title: 'Semog Garante',
    slug: 'garante',
    layout: [garanteHero, garanteDetalhado, garanteDiferenca, garanteFaq, garanteCtaBand],
  })

  await upsertPage(payload, {
    title: 'Para Incorporadoras',
    slug: 'incorporadoras',
    layout: [
      incorporadorasHero,
      incorporadorasGanhos,
      incorporadorasProcesso,
      incorporadorasRegistros,
      incorporadorasCtaBand,
    ],
  })

  await upsertPage(payload, {
    title: 'Contato',
    slug: 'contato',
    layout: [contatoHero, contatoFormEmbed, contatoUnidades],
  })

  await upsertPage(payload, {
    title: 'Solicitar Proposta',
    slug: 'proposta',
    layout: [propostaHero, propostaProvaSocial, propostaFormEmbed, propostaCtaBand],
  })

  await seedCityLanding(payload, recifeCityLanding)
  await seedCityLanding(payload, joaoPessoaCityLanding)
  await seedCityLanding(payload, campinaGrandeCityLanding)
  await seedCityLanding(payload, belemCityLanding)
}

await seedPages()
