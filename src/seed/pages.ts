import config from '@payload-config'
import { getPayload } from 'payload'
import type {
  AppShowcaseBlock,
  CitiesBlock,
  CTABandBlock,
  FaqBlock,
  FeatureGridBlock,
  GaranteBlock,
  HeroBlock,
  Page,
  RegistrosBlock,
  RichTextBlock,
  ShowcaseBlock,
  StatsBlock,
} from '@/payload-types'

/**
 * Seed idempotente de seis páginas de CMS compostas só de blocos já
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
}

await seedPages()
