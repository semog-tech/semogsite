import config from '@payload-config'
import { getPayload } from 'payload'
import type {
  AppShowcaseBlock,
  BairrosBlock,
  BenefitsBlock,
  ClubeBeneficiosBlock,
  CompareBlock,
  ContactInfoBlock,
  CTABandBlock,
  CustoChecklistBlock,
  DevQuoteBlock,
  FaqBlock,
  FeatureGridBlock,
  FormEmbedBlock,
  GaranteBlock,
  HeroBlock,
  Page,
  PartnerSplitBlock,
  PillarsBlock,
  PrestacaoBlock,
  PriceMomentBlock,
  ProcessoTimelineBlock,
  RegistrosBlock,
  RichTextBlock,
  SociosBlock,
  SolutionSplitBlock,
  StatsBlock,
  TecnologiaRoadmapBlock,
  TestimonialsBlock,
  TimelineBlock,
  ValuesMarqueeBlock,
  WordsSectionBlock,
} from '@/payload-types'
import { getMediaId } from './lib/media'

/**
 * Seed idempotente de treze páginas de CMS compostas só de blocos já
 * existentes (sem mídia, sem novo blocos):
 *
 * - "Privacidade" e "Termos", fiel ao corpo de `_reference/privacidade.html`
 *   e `_reference/termos.html`: Hero simples (headline + subhead com a data
 *   de "última atualização", sem ctas/video) seguido de um único bloco
 *   RichText com o texto completo — heading `h2` por seção numerada e
 *   listas onde o `_reference` usa `<ul>`.
 * - "A Semog" (slug `semog`), fiel a `_reference/semog.html`: Hero (poster
 *   `hero-towers.webp`) + WordsSection (parágrafo-manifesto, scrub palavra-
 *   a-palavra) + Stats (mini-stats sem cabeçalho próprio, igual ao ref,
 *   dentro do próprio `.manifesto`) + Timeline (`#historia`, os 8 cartões
 *   datados 1991→Hoje, pin + scrub horizontal) + Pillars (Valores,
 *   hover-rows) + Socios ("Empresa humana", `equipe.webp` + `.f-feats`) +
 *   CTABand `variant:'centered'` final. Sem Cities: `_reference/semog.html`
 *   não tem grid de "Presença" — isso é contado só pela Timeline.
 * - "Soluções" (slug `solucoes`), fiel a `_reference/solucoes.html`: Hero
 *   (poster `residencial.webp`) + SolutionSplit (as 3 verticais
 *   residencial/comercial/associações — `.vertical.sec-light` `.split`
 *   alternado com `.svc-tags`, associações em `.assoc` full-bleed,
 *   `_reference/solucoes.html:411-484`) + Benefits `variant:'bento'` (o
 *   `.benefits.bento` de 5 células — 24h/acesso direto/35 anos/equipes
 *   locais (`blog-lazer.webp`)/100% digital, `:487-520`) + Prestacao
 *   (`#prestacao`, `prestacao-contas.webp`) + Garante em banda com vídeo
 *   (`garante.mp4`/`garante.webp` + chip "1%", `:557-616`) + AppShowcase
 *   (seção do aplicativo, `app-phone.webp`, `:618-642`) + TecnologiaRoadmap (`#tecnologia`,
 *   Semog One `semog-one.webp` + roadmap 2026, `:645-691`) + ClubeBeneficios
 *   (`#beneficios`, `:693-724`) + Faq (as 5 perguntas do FAQPage schema.org
 *   do `_reference`) + CTABand `variant:'centered'` final. Ordem exata do
 *   ref: garante+app vêm ANTES de tecnologia+clube.
 * - "Administração de condomínios" (slug `administracao-de-condominios`),
 *   fiel a `_reference/administracao-de-condominios.html`: Hero (poster
 *   `c-chave.webp`, `.page-hero` com números próprios da página) +
 *   FeatureGrid `variant:'light'` (a grade `.svc-grid` de 9 serviços com SVG
 *   inline, "O que fazemos") + Pillars (os 4 hover-rows de `.method`/"Como
 *   fazemos", `tightTop:false`) + CustoChecklist ("Quanto custa", bloco
 *   novo — prosa + `.cost-card` com checklist de 6 itens) + Faq
 *   (`white:true`, as 5 perguntas do FAQPage schema.org) + CTABand
 *   `variant:'centered'` final (`titleAccent:'pela líder.'`). Ordem exata
 *   do ref.
 * - "Semog Garante" (slug `garante`), fiel a `_reference/garante.html`, ordem
 *   exata do ref (9 seções): Hero (`garante.mp4`/`garante.webp`, chip de
 *   vidro "1%" via `priceChip`, `.g-hero`) + ValuesMarquee `variant:'ticker'`
 *   (`.g-ticker`, "100% DA ARRECADAÇÃO / TODO MÊS / SEM SUSTO") +
 *   WordsSection `variant:'problem'` (`.g-problem`, scrub palavra-a-palavra)
 *   + Pillars `light/compact` (`.g-how`, os 4 hover-rows claros de "Como
 *   funciona") + PriceMoment (`.g-one`, o "1%" tipográfico gigante) + Compare
 *   (`.g-compare`, os 2 cartões antes/depois) + PartnerSplit (`.g-partner`,
 *   "Quem garante a garantia", G5 Partners em destaque) + Faq `dark:true`
 *   (`.faq` em `--bg-deep`, as 4 perguntas do FAQPage schema.org) + CTABand
 *   `variant:'centered'` final.
 * - "Incorporadoras" (slug `incorporadoras`), fiel a
 *   `_reference/incorporadoras.html`, ordem exata do ref: Hero (`.page-hero`
 *   80dvh, `incorporadoras.webp`) + WordsSection `variant:'argument'`
 *   (`.argument`, o parágrafo-manifesto + `sub`) + ProcessoTimeline (bloco
 *   novo — `.proc-list`, timeline vertical com linha viva, dots numerados,
 *   ícones SVG e `.tags` por etapa, "Como trabalhamos") + FeatureGrid
 *   `variant:'dark' light white columns:'2' stagger` (`.why-grid.sec-light
 *   white`, os 4 cards de "O que a sua incorporadora ganha", com glifo SVG)
 *   + DevQuote (bloco novo — `.dev-quote`, blockquote scrub + cite) +
 *   CTABand `variant:'centered' buttonVariant:'primary'` final (o
 *   `.final-cta` deste ref usa `.btn-primary`, não `.btn-white` como as
 *   outras páginas). Sem a faixa `Registros` que o seed antigo inseria —
 *   não existe no ref (ver `.superpowers/sdd/audit-servicos.md`, seção
 *   `/incorporadoras`, linha "[CMS-only] Registros").
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
 *   belem}`), fiéis a `_reference/administradora-de-condominios-*.html`: as
 *   quatro páginas compartilham um único template — `<head>`/`<style>`/
 *   nav/footer byte-idênticos, confirmado em
 *   `.superpowers/sdd/audit-cidades.md` — montado por `seedCityLanding`, só
 *   variando o conteúdo por cidade, nas 9 seções do ref, na ordem exata:
 *   Hero (`poster` = foto da cidade via `pageHeroOverlay`) + Stats (as 4
 *   `.mini-stats`, idênticas nas 4 páginas) + ContactInfo `variant:'card'`
 *   (o `.unit-card` rico — foto, chip Matriz/Filial, `dl` de contato, 2
 *   ações) + Bairros (bloco novo — os `.hood-pills`) + FeatureGrid
 *   `variant:'rows'` (a lista `.svc-rows` com intro + badges "EXCLUSIVA"/
 *   "1% AO MÊS") + Garante (a banda split `.g-band`, via o grupo `pct`) +
 *   Testimonials (os dois `.depo-card`) + Registros `light:true` (as
 *   credenciais `.creds`, claras porque o ref aninha dentro da mesma
 *   `.depo.sec-light`) + Faq `tightTop:true` (as 4 perguntas de `.faq`) +
 *   CTABand `variant:'centered'` final.
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

async function seedSemogPage(payload: Awaited<ReturnType<typeof getPayload>>) {
  const [heroPosterId, equipeId] = await Promise.all([
    getMediaId(payload, 'hero-towers.webp'),
    getMediaId(payload, 'equipe.webp'),
  ])

  // `.page-hero`, `_reference/semog.html:236-245` — só imagem de fundo
  // (`.bg`), sem vídeo nesta página interna.
  const semogHero: Omit<HeroBlock, 'id' | 'blockName'> = {
    blockType: 'hero',
    eyebrow: 'Desde 1991',
    headline: 'Governança se constrói com tempo.',
    subhead:
      'Nascemos no Recife, crescemos com o Nordeste e nos tornamos referência nacional em administração de condomínios.',
    poster: heroPosterId,
  }

  // `.manifesto .big`, `_reference/semog.html:248-253` — o `em` "Esse
  // trabalho é nosso." em ice não tem contrapartida no `WordsSectionBlock`
  // (`text` é texto puro, sem inline formatting), mesma limitação já
  // presente no manifesto da home.
  const semogManifesto: Omit<WordsSectionBlock, 'id' | 'blockName'> = {
    blockType: 'wordsSection',
    text: 'A Semog existe para que síndicos e moradores nunca precisem entender de contabilidade, jurídico ou manutenção. Esse trabalho é nosso. O de vocês é viver bem.',
  }

  // `.mini-stats`, `_reference/semog.html:254-271` — vive dentro da própria
  // `.manifesto`, sem cabeçalho próprio (por isso sem eyebrow/title, ao
  // contrário do StatsBlock da home).
  const semogStats: Omit<StatsBlock, 'id' | 'blockName'> = {
    blockType: 'stats',
    items: [
      { value: 35, label: 'Anos de mercado' },
      { value: 700, prefix: '+', label: 'Condomínios' },
      { value: 70, prefix: '+', suffix: 'mil', label: 'Clientes' },
      { value: 100, prefix: '+', label: 'Colaboradores' },
    ],
  }

  // `#historia`, `_reference/semog.html:275-328` — 8 cartões datados, pin +
  // scrub horizontal via `TimelinePinned`.
  const semogTimeline: Omit<TimelineBlock, 'id' | 'blockName'> = {
    blockType: 'timeline',
    eyebrow: 'Nossa história',
    title: 'De 1991 até aqui.',
    text: 'Três décadas e meia de crescimento contínuo, sempre com os pés no Nordeste.',
    items: [
      {
        date: '1991',
        title: 'Fundação no Recife',
        text: 'A Semog nasce em Pernambuco com uma convicção: condomínio bem administrado se prova com números.',
      },
      {
        date: '2000',
        title: 'Liderança regional',
        text: 'A carteira de condomínios se multiplica e a Semog se consolida como referência no estado.',
      },
      {
        date: '2010',
        title: 'Expansão pela Paraíba',
        text: 'Chegamos a João Pessoa e Campina Grande com equipes locais e a mesma governança da matriz.',
      },
      {
        date: '2018',
        title: 'Norte no mapa',
        text: 'A filial de Belém do Pará leva o método Semog para além do Nordeste.',
      },
      {
        date: '2019',
        title: 'Pioneirismo em IA',
        text: 'Criamos o primeiro chatbot do mercado de administradoras de condomínios do Brasil.',
      },
      {
        date: '2023',
        title: 'Prestação de contas digital',
        text: 'Lançamos a prestação de contas 100% digital, com documentos, gráficos e assinatura digital.',
      },
      {
        date: '2025',
        title: 'Semog Garante',
        text: 'Com a G5 Partners, criamos o produto que zera a inadimplência por 1% da arrecadação.',
      },
      {
        date: 'Hoje',
        title: 'Líder do Nordeste',
        text: 'Mais de 700 condomínios, 70 mil clientes e 100 especialistas. E seguimos crescendo.',
        now: true,
      },
    ],
  }

  // `.values-sec` `#valores`, `_reference/semog.html:330-349` — hover-rows;
  // o `PillarsBlock` não tem campo de título de seção, então o h2 "O que
  // não abrimos mão." não tem onde entrar (ver nota no relatório da task).
  const semogValores: Omit<PillarsBlock, 'id' | 'blockName'> = {
    blockType: 'pillars',
    items: [
      {
        title: 'Transparência',
        text: 'Cada centavo do condomínio é rastreável. Prestação de contas aberta, documentos públicos para os condôminos e nada embaixo do tapete.',
      },
      {
        title: 'Retidão',
        text: 'Fazemos o certo mesmo quando ninguém está olhando. É assim há 35 anos, e é por isso que síndicos renovam com a gente.',
      },
      {
        title: 'Dinâmica',
        text: 'Condomínio não pode esperar. Respostas rápidas, processos digitais e uma equipe que resolve no primeiro contato.',
      },
    ],
  }

  // `.founders` `#socios`, `_reference/semog.html:352-385`.
  const semogSocios: Omit<SociosBlock, 'id' | 'blockName'> = {
    blockType: 'socios',
    eyebrow: 'Empresa humana',
    title: 'Tecnologia na operação. Gente na relação.',
    text: 'Investimos pesado em tecnologia para que sobre tempo para o que importa: ouvir. Na Semog, síndico e condômino falam com quem decide.',
    items: [
      {
        title: 'Canal direto com os sócios',
        text: 'Sem camadas, sem protocolo, sem "vou verificar e retorno". Quem atende resolve.',
      },
      {
        title: 'Equipes locais de verdade',
        text: 'Cada unidade tem gente da cidade, que conhece a rua, o clima e o jeito de lá.',
      },
      {
        title: 'Relacionamentos de década',
        text: 'Boa parte dos nossos condomínios está conosco há mais de dez anos, e renova.',
      },
    ],
    image: equipeId,
    caption: 'Acesso fácil aos sócios. Regra da casa desde 1991.',
  }

  // `.final-cta`, `_reference/semog.html:388-399` — `variant:'centered'`,
  // igual ao final-cta da home (não a banda `--grad-band`).
  const semogCtaBand: Omit<CTABandBlock, 'id' | 'blockName'> = {
    blockType: 'ctaBand',
    variant: 'centered',
    title: 'Venha conhecer a Semog por dentro.',
    text: 'Converse com a nossa equipe e receba uma proposta sob medida para o seu condomínio.',
    cta: { label: 'Solicitar proposta', href: '/proposta' },
  }

  await upsertPage(payload, {
    title: 'A Semog',
    slug: 'semog',
    layout: [
      semogHero,
      semogManifesto,
      semogStats,
      semogTimeline,
      semogValores,
      semogSocios,
      semogCtaBand,
    ],
  })
}

// ===== "Soluções" (slug `solucoes`), fiel a `_reference/solucoes.html` =====

async function seedSolucoesPage(payload: Awaited<ReturnType<typeof getPayload>>) {
  const [
    residencialId,
    comercialId,
    associacoesId,
    prestacaoContasId,
    semogOneId,
    garanteVideoId,
    garantePosterId,
    blogLazerId,
    appPhoneId,
  ] = await Promise.all([
    getMediaId(payload, 'residencial.webp'),
    getMediaId(payload, 'comercial.webp'),
    getMediaId(payload, 'associacoes.webp'),
    getMediaId(payload, 'prestacao-contas.webp'),
    getMediaId(payload, 'semog-one.webp'),
    getMediaId(payload, 'garante.mp4'),
    getMediaId(payload, 'garante.webp'),
    getMediaId(payload, 'blog-lazer.webp'),
    getMediaId(payload, 'app-phone.webp'),
  ])

  // `.page-hero`, `_reference/solucoes.html:400-409` — mesmo `residencial.webp`
  // do `.bg` (reaproveitado também na vertical "Residenciais" logo abaixo,
  // igual ao ref, que usa esse arquivo duas vezes). `pageHeroOverlay` liga o
  // tratamento `.page-hero`/`.bg`/`::after` (74dvh, opacidade 0.5, gradiente
  // escuro) fiel a `_reference/solucoes.html:87-107`.
  const solucoesHero: Omit<HeroBlock, 'id' | 'blockName'> = {
    blockType: 'hero',
    headline: 'Tudo que um condomínio precisa. E o que nenhum outro oferece.',
    subhead:
      'Gestão financeira, contábil, jurídica e de pessoas, com a única prestação de contas 100% digital do mercado e garantia de inadimplência zero.',
    poster: residencialId,
    pageHeroOverlay: true,
  }

  // As 3 verticais `#residenciais`/`#comerciais`/`#associacoes`, fiel a
  // `_reference/solucoes.html:411-484`: residenciais e comerciais em
  // `.split` alternado (comerciais com `reversed: true` — imagem primeiro,
  // igual ao ref), associações em `.assoc` full-bleed (`variant: 'assoc'`).
  const solucoesVerticais: Omit<SolutionSplitBlock, 'id' | 'blockName'> = {
    blockType: 'solutionSplit',
    items: [
      {
        variant: 'split',
        kicker: 'Condomínios Residenciais',
        title: 'O prédio funciona. O morador nem percebe.',
        text: 'Assumimos toda a operação do condomínio para que síndico e moradores tenham uma única preocupação: viver bem. Financeiro em dia, funcionários cuidados, manutenção prevista e assembleias organizadas.',
        tags: [
          { label: 'Gestão financeira' },
          { label: 'Cobrança e boletos' },
          { label: 'Folha e RH do condomínio' },
          { label: 'Assessoria jurídica' },
          { label: 'Assembleias' },
          { label: 'Manutenção preventiva' },
          { label: 'Seguros obrigatórios' },
        ],
        image: residencialId,
        reversed: false,
      },
      {
        variant: 'split',
        kicker: 'Condomínios Comerciais',
        title: 'Eficiência que valoriza o metro quadrado.',
        text: 'Edifícios corporativos e centros empresariais exigem previsibilidade de custos, rateios impecáveis e fornecedores sob controle. A Semog entrega relatórios gerenciais que o conselho entende e aprova.',
        tags: [
          { label: 'Rateios e provisões' },
          { label: 'Gestão de contratos' },
          { label: 'Relatórios gerenciais' },
          { label: 'Compliance condominial' },
          { label: 'Gestão de facilities' },
          { label: 'Previsão orçamentária' },
        ],
        image: comercialId,
        reversed: true,
      },
      {
        variant: 'assoc',
        kicker: 'Associações',
        title: 'Governança para comunidades inteiras.',
        text: 'Loteamentos, associações de moradores e clubes têm regras próprias, receitas próprias e desafios próprios. Estruturamos estatutos, contribuições e conselhos que funcionam.',
        image: associacoesId,
        ctaLabel: 'Solicitar proposta',
        ctaHref: '/proposta',
      },
    ],
  }

  // `.benefits.sec-light.white` > `.bento` (sem id), fiel a
  // `_reference/solucoes.html:487-520`: 5 células na ordem exata do ref —
  // c1 24h / c2 acesso direto aos sócios / c3 35 anos / c4 equipes locais
  // (`blog-lazer.webp`) / c5 100% digital.
  const solucoesBenefits: Omit<BenefitsBlock, 'id' | 'blockName'> = {
    blockType: 'benefits',
    variant: 'bento',
    eyebrow: 'Por que Semog',
    title: 'O que muda quando a Semog assume.',
    titleAccent: 'Semog assume.',
    items: [
      {
        value: '24h',
        title: 'Resposta em um dia útil',
        description: 'Demandas de síndicos e condôminos com prazo de resposta definido e cumprido.',
      },
      {
        title: 'Acesso direto aos sócios',
        description:
          'Nenhuma administradora do porte da Semog oferece isso. Aqui, é regra da casa.',
      },
      {
        value: '35',
        title: 'Anos de mercado',
        description: 'Solidez comprovada desde 1991.',
      },
      {
        title: 'Equipes locais',
        description: 'Presença física em quatro cidades.',
        image: blogLazerId,
      },
      {
        value: '100%',
        title: 'Digital de verdade',
        description: 'Do boleto à assembleia, tudo online.',
      },
    ],
  }

  // `#prestacao`, `_reference/solucoes.html:522-555`.
  const solucoesPrestacao: Omit<PrestacaoBlock, 'id' | 'blockName'> = {
    blockType: 'prestacao',
    title: 'A prestação de contas que nenhuma outra administradora tem.',
    text: 'Desenvolvida pela Semog, ela transforma o balancete em algo que qualquer condômino entende e confia.',
    image: prestacaoContasId,
    list: [
      {
        title: 'Todos os documentos',
        text: 'Notas, comprovantes e extratos anexados a cada lançamento.',
      },
      {
        title: 'Gráficos claros',
        text: 'Receita, despesa e evolução do fundo de reserva em visual simples.',
      },
      {
        title: 'Assinatura digital',
        text: 'Aprovação do síndico e do conselho com validade jurídica.',
      },
      {
        title: 'Sempre disponível',
        text: 'O condômino consulta quando quiser, sem pedir a ninguém.',
      },
    ],
  }

  // `#tecnologia`, `_reference/solucoes.html:645-691`.
  const solucoesTecnologia: Omit<TecnologiaRoadmapBlock, 'id' | 'blockName'> = {
    blockType: 'tecnologiaRoadmap',
    title: 'Software de dono, não de prateleira.',
    text: 'A Semog tem equipe de desenvolvimento própria desde a década passada. Em 2019, criamos o primeiro chatbot do setor. Hoje, toda a operação roda no nosso ERP.',
    intro: {
      image: semogOneId,
      name: 'Semog One',
      description:
        'O ERP que construímos para o nosso jeito de administrar: financeiro, cobrança, assembleias, documentos e atendimento em uma única plataforma, evoluindo toda semana.',
      tags: [
        { label: 'Financeiro e cobrança' },
        { label: 'Prestação de contas digital' },
        { label: 'Assembleias' },
        { label: 'Atendimento com IA' },
        { label: 'Integração com o app' },
      ],
    },
    roadmapLabel: 'Roadmap 2026',
    steps: [
      {
        title: 'Gestão de Manutenções',
        text: 'Preventivas programadas, chamados e histórico por equipamento.',
        status: 'Em desenvolvimento',
      },
      {
        title: 'Gestão de Contratos',
        text: 'Fornecedores, vigências e reajustes monitorados automaticamente.',
        status: 'Previsto para 2026',
      },
      {
        title: 'Chatbot de atendimento',
        text: 'Pioneiro no setor desde 2019, em evolução contínua.',
        status: 'No ar',
        live: true,
      },
    ],
  }

  // `#beneficios` (Clube de benefícios), `_reference/solucoes.html:693-724`.
  const solucoesClube: Omit<ClubeBeneficiosBlock, 'id' | 'blockName'> = {
    blockType: 'clubeBeneficios',
    title: 'Ser Semog também vale fora do boleto.',
    text: 'Condomínios e moradores Semog têm acesso a um clube de vantagens negociado pela nossa escala de 700 condomínios.',
    items: [
      {
        title: 'Internet mais barata',
        text: 'Planos coletivos negociados com provedores parceiros para o condomínio inteiro.',
      },
      {
        title: 'Desconto com fornecedores',
        text: 'Rede homologada de manutenção, limpeza, jardinagem e segurança com preço de escala.',
      },
      {
        title: 'Seguros em condições especiais',
        text: 'Seguro obrigatório e coberturas adicionais com corretoras parceiras.',
      },
      {
        title: 'Vantagens para moradores',
        text: 'Convênios com farmácias, academias e serviços locais em cada cidade Semog.',
      },
    ],
    note: 'O catálogo completo de parceiros é atualizado mensalmente e divulgado no aplicativo Semog.',
  }

  // `#garante`, `_reference/solucoes.html:557-616` — banda com vídeo, mesmo
  // padrão `.g-band-home` da home, ANTES do App (corrigindo a ordem vs. o
  // seed anterior). Em modo banda (`video`/`poster` preenchidos) o
  // `GaranteBlock` não renderiza `features`/`note` (só eyebrow/título/
  // texto/cta/priceChip) — mantidos aqui mesmo assim, para não perder o
  // conteúdo editorial dos 4 `.g-step` (fica disponível assim que o
  // Component ganhar suporte a exibi-los também no modo banda).
  const solucoesGarante: Omit<GaranteBlock, 'id' | 'blockName'> = {
    blockType: 'garante',
    eyebrow: 'Semog Garante',
    title: 'Inadimplência zero.',
    text: 'O único produto do mercado que garante 100% da arrecadação do condomínio, todos os meses. Uma parceria Semog + G5 Partners.',
    video: garanteVideoId,
    poster: garantePosterId,
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
    priceChip: { value: '1%', label: 'da arrecadação. Sem taxa de adesão, sem letra miúda.' },
    note: '1% da arrecadação. Sem taxa de adesão, sem letra miúda.',
  }

  // `#aplicativo`, `_reference/solucoes.html:618-642` — `.app-media` com
  // `app-phone.webp`.
  const solucoesApp: Omit<AppShowcaseBlock, 'id' | 'blockName'> = {
    blockType: 'appShowcase',
    eyebrow: 'Aplicativo',
    title: 'Um aplicativo que o morador usa de verdade.',
    text: 'Nada de portal que ninguém acessa. O app da Semog concentra o dia a dia do condomínio em uma interface simples, no bolso de cada morador.',
    image: appPhoneId,
    features: [
      { title: 'Boletos e segunda via', description: 'Histórico completo e pagamento na hora.' },
      { title: 'Reservas', description: 'Salão de festas, churrasqueira e quadra.' },
      { title: 'Assembleias e votações', description: 'Participação e voto de onde estiver.' },
      { title: 'Avisos', description: 'Comunicados da administração em tempo real.' },
      { title: 'Ocorrências', description: 'Registro e acompanhamento transparente.' },
      { title: 'Documentos', description: 'Convenção, atas e regulamentos sempre à mão.' },
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
    variant: 'centered',
    title: 'Pronto para uma gestão sem surpresas?',
    text: 'Conte como é o seu condomínio e receba uma proposta em até 24 horas úteis.',
    cta: { label: 'Solicitar proposta', href: '/proposta' },
  }

  await upsertPage(payload, {
    title: 'Soluções',
    slug: 'solucoes',
    layout: [
      solucoesHero,
      solucoesVerticais,
      solucoesBenefits,
      solucoesPrestacao,
      solucoesGarante,
      solucoesApp,
      solucoesTecnologia,
      solucoesClube,
      solucoesFaq,
      solucoesCtaBand,
    ],
  })
}

// ===== "Administração de condomínios" (slug `administracao-de-condominios`),
// fiel a `_reference/administracao-de-condominios.html`: Hero (`c-chave.webp`,
// `.page-hero` 88dvh/opacidade 0.85/gradiente próprio) + FeatureGrid
// `variant:'light'` (a grade `.svc-grid` de 9 serviços com SVG inline, seção
// "O que fazemos") + Pillars (`.method`/"Como fazemos", 4 hover-rows,
// `tightTop:false` pois `.method` não zera o padding-top) + CustoChecklist
// ("Quanto custa", bloco novo — `.cost`/`.cost-card`, 6-item checklist) + Faq
// (`white:true`, as 5 perguntas do FAQPage schema.org) + CTABand
// `variant:'centered'` final. Ordem exata do ref. =====

async function seedAdministracaoPage(payload: Awaited<ReturnType<typeof getPayload>>) {
  const cChaveId = await getMediaId(payload, 'c-chave.webp')

  // `.page-hero`, `_reference/administracao-de-condominios.html:61-77`:
  // números próprios desta página (88dvh, opacidade 0.85, `background-
  // position: center 40%`, gradiente com parada intermediária a 45% —
  // diferentes dos de `/solucoes`, daí os 4 campos `pageHero*` dedicados em
  // `Hero/config.ts`).
  const administracaoHero: Omit<HeroBlock, 'id' | 'blockName'> = {
    blockType: 'hero',
    eyebrow: 'O serviço principal da Semog',
    headline: 'Administração de condomínios, por inteiro.',
    subhead:
      'Do boleto à assembleia, assumimos a operação para o síndico decidir com tranquilidade e o morador só morar.',
    poster: cChaveId,
    pageHeroOverlay: true,
    pageHeroMinHeight: '88dvh',
    pageHeroPosterOpacity: 0.85,
    pageHeroBgPosition: 'center 40%',
    pageHeroGradient:
      'linear-gradient(180deg, rgba(5,8,26,0.45) 0%, rgba(5,8,26,0.15) 45%, rgba(5,8,26,0.85) 100%)',
    ctas: [{ label: 'Solicitar proposta', href: '/proposta', variant: 'white' }],
  }

  // `.svc.sec-light` > `.svc-grid`, `_reference/administracao-de-
  // condominios.html:230-286`: 9 `.svc-card` com SVG inline (`iconSvg`,
  // markup verbatim do ref, sem a tag <svg> em volta).
  const administracaoServicos: Omit<FeatureGridBlock, 'id' | 'blockName'> = {
    blockType: 'featureGrid',
    variant: 'light',
    eyebrow: 'O que fazemos',
    title: 'Tudo que o condomínio precisa, em um só contrato.',
    titleAccent: 'em um só contrato.',
    features: [
      {
        iconSvg: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
        title: 'Gestão financeira',
        description:
          'Boletos, contas a pagar, fluxo de caixa, previsão orçamentária e fundo de reserva sob controle.',
      },
      {
        iconSvg: '<path d="M3 3v18h18"/><path d="M7 15l4-6 4 3 5-8"/>',
        title: 'Cobrança e inadimplência',
        description:
          'Régua de cobrança profissional e, com o Semog Garante, receita 100% assegurada em contrato.',
      },
      {
        iconSvg:
          '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
        title: 'Contabilidade e prestação de contas',
        description:
          'Balancetes, obrigações fiscais e a única prestação de contas 100% digital do mercado.',
      },
      {
        iconSvg:
          '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
        title: 'Departamento pessoal',
        description:
          'Folha, férias, encargos e rotinas trabalhistas dos funcionários do condomínio, sem risco para o síndico.',
      },
      {
        iconSvg: '<path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6Z"/>',
        title: 'Jurídico condominial',
        description:
          'Convenção, regimento, notificações, acordos e suporte em conflitos, com advogados especializados.',
      },
      {
        iconSvg:
          '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
        title: 'Assembleias',
        description:
          'Convocação, condução, ata e votação digital pelo aplicativo, presencial ou online.',
      },
      {
        iconSvg:
          '<path d="M14.7 6.3a5 5 0 0 0-7.07 7.07l-4.35 4.35a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l4.35-4.35a5 5 0 0 0 7.07-7.07l-2.83 2.83-2.12-2.12Z"/>',
        title: 'Manutenção e fornecedores',
        description:
          'Preventivas, orçamentos comparados e rede homologada com preço de escala de 700 condomínios.',
      },
      {
        iconSvg:
          '<path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6Z"/><path d="m9 12 2 2 4-4"/>',
        title: 'Seguros obrigatórios',
        description:
          'Cotação, contratação e renovação do seguro condominial em condições especiais.',
      },
      {
        iconSvg: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
        title: 'Atendimento e comunicação',
        description:
          'Canal direto com síndicos e moradores: aplicativo, WhatsApp e o chatbot pioneiro do setor.',
      },
    ],
  }

  // `.method`, `_reference/administracao-de-condominios.html:288-309`: 4
  // hover-rows via `PillarsBlock` (mesmo tratamento de `.g-step`/`.pillar-
  // row` — ver doc do campo `eyebrow` em `Pillars/config.ts`). `tightTop:
  // false` porque `.method` NÃO zera o padding-top (ao contrário da Home,
  // onde `.pillars` cola no manifesto anterior).
  const administracaoComoFazemos: Omit<PillarsBlock, 'id' | 'blockName'> = {
    blockType: 'pillars',
    eyebrow: 'Como fazemos',
    tightTop: false,
    items: [
      {
        title: 'Diagnóstico e proposta',
        text: 'Entendemos o momento do condomínio: inadimplência, contratos, pendências e prioridades. A proposta chega em até 24 horas úteis, com escopo claro.',
      },
      {
        title: 'Migração sem ruptura',
        text: 'Auditoria e transferência de documentos, comunicação aos condôminos e cadastro completo no Semog One, sem interromper a operação.',
      },
      {
        title: 'Operação com método',
        text: 'Rotinas financeiras, DP, manutenção e atendimento rodando no nosso ERP, com prazos definidos e indicadores acompanhados pela diretoria.',
      },
      {
        title: 'Transparência contínua',
        text: 'Prestação de contas digital aberta a qualquer condômino, relatórios mensais ao conselho e acesso direto aos sócios quando precisar.',
      },
    ],
  }

  // `.cost.sec-light.white`, `_reference/administracao-de-
  // condominios.html:311-346` — bloco novo, ver `CustoChecklist/config.ts`.
  const administracaoCusto: Omit<CustoChecklistBlock, 'id' | 'blockName'> = {
    blockType: 'custoChecklist',
    title: 'Quanto custa uma administradora?',
    titleAccent: 'administradora?',
    paragraphs: [
      {
        text: 'No mercado, a taxa de administração varia conforme o porte do condomínio e o escopo contratado. Desconfie de preço único sem conhecer o condomínio: gestão séria começa com diagnóstico.',
      },
      {
        text: 'Na Semog, a proposta é personalizada, sem custos escondidos, e o Semog Garante pode zerar a inadimplência por 1% da arrecadação.',
      },
    ],
    cta: { label: 'Solicitar proposta', href: '/proposta' },
    checklistLabel: 'O que avaliar antes de contratar',
    checklist: [
      { text: 'Tempo de mercado e carteira de clientes comprovada' },
      { text: 'Transparência real da prestação de contas' },
      { text: 'Tecnologia que o morador consegue usar' },
      { text: 'Estrutura própria de cobrança de inadimplentes' },
      { text: 'Acesso a quem decide, não a protocolos' },
      { text: 'Registro e regularidade nos órgãos do setor' },
    ],
  }

  // `.faq.sec-light.white`, `_reference/administracao-de-
  // condominios.html:349-375` — `white: true` (ao contrário do `.faq.sec-
  // light` sem `.white` de `/solucoes`) e `tightTop: true` (`.faq {
  // padding-top: 0 }`, só nesta família de páginas).
  const administracaoFaq: Omit<FaqBlock, 'id' | 'blockName'> = {
    blockType: 'faq',
    title: 'Perguntas frequentes.',
    white: true,
    tightTop: true,
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

  // `.final-cta`, `_reference/administracao-de-condominios.html:377-389`:
  // `titleAccent` reproduz o `<span class="gx-ice">pela líder.</span>`.
  const administracaoCtaBand: Omit<CTABandBlock, 'id' | 'blockName'> = {
    blockType: 'ctaBand',
    variant: 'centered',
    title: 'Seu condomínio administrado pela líder.',
    titleAccent: 'pela líder.',
    text: 'Conte como é o seu condomínio e receba uma proposta sob medida em até 24 horas úteis.',
    cta: { label: 'Solicitar proposta', href: '/proposta' },
  }

  await upsertPage(payload, {
    title: 'Administração de condomínios',
    slug: 'administracao-de-condominios',
    layout: [
      administracaoHero,
      administracaoServicos,
      administracaoComoFazemos,
      administracaoCusto,
      administracaoFaq,
      administracaoCtaBand,
    ],
  })
}

// ===== "Semog Garante" (slug `garante`), fiel a `_reference/garante.html`,
// ordem exata do ref (9 seções) =====

async function seedGarantePage(payload: Awaited<ReturnType<typeof getPayload>>) {
  const [garanteVideoId, garantePosterId] = await Promise.all([
    getMediaId(payload, 'garante.mp4'),
    getMediaId(payload, 'garante.webp'),
  ])

  // `.g-hero`, `_reference/garante.html:59-104,268-293` — hero de vídeo
  // full-bleed (100dvh) com o chip de vidro "1%" (`priceChip`, liga o
  // overlay `::after` + a `.row` docked, ver `Hero/config.ts`).
  const garanteHero: Omit<HeroBlock, 'id' | 'blockName'> = {
    blockType: 'hero',
    eyebrow: 'Semog Garante · uma parceria Semog + G5 Partners',
    headline: 'Inadimplência zero.',
    subhead:
      'O condomínio recebe 100% da arrecadação prevista, todos os meses. Chova, atrase quem atrasar.',
    video: garanteVideoId,
    poster: garantePosterId,
    ctas: [{ label: 'Solicitar proposta', href: '/proposta', variant: 'white' }],
    priceChip: { value: '1%', label: 'da arrecadação. Sem adesão, sem letra miúda.' },
  }

  // `.g-ticker`, `_reference/garante.html:105-112,296-303` — o único
  // marquee da página. Sem "/" visível no ref (usa `&nbsp;` como
  // espaçador): `separator` recebe 4 nbsp reais, não "/".
  const garanteTicker: Omit<ValuesMarqueeBlock, 'id' | 'blockName'> = {
    blockType: 'valuesMarquee',
    variant: 'ticker',
    items: ['100% DA ARRECADAÇÃO', 'TODO MÊS', 'SEM SUSTO'],
    separator: '    ',
  }

  // `.g-problem`, `_reference/garante.html:114-120,306-310` — o parágrafo
  // "O problema" com scrub palavra-a-palavra (`Words`, via `variant:'problem'`).
  const garanteProblema: Omit<WordsSectionBlock, 'id' | 'blockName'> = {
    blockType: 'wordsSection',
    variant: 'problem',
    text: 'Todo síndico conhece o ciclo: inadimplência sobe, o caixa aperta, a obra para, a assembleia esquenta. O Semog Garante quebra esse ciclo no primeiro mês.',
  }

  // `.g-how.sec-light`, `_reference/garante.html:122-141,313-333` — os 4
  // hover-rows claros de "Como funciona" (`light`/`compact`, ver doc dos
  // campos em `Pillars/config.ts`). `.g-how` não zera o padding-top →
  // `tightTop: false`.
  const garanteComoFunciona: Omit<PillarsBlock, 'id' | 'blockName'> = {
    blockType: 'pillars',
    eyebrow: 'Como funciona',
    tightTop: false,
    light: true,
    compact: true,
    items: [
      {
        title: 'O condomínio recebe tudo',
        text: 'No dia previsto, 100% da arrecadação entra no caixa do condomínio. Com ou sem atrasos, a receita está garantida em contrato.',
      },
      {
        title: 'A cobrança vira problema nosso',
        text: 'A Semog e a G5 Partners assumem toda a régua de cobrança: negociação humana, dentro da lei e sem constrangimento entre vizinhos.',
      },
      {
        title: 'O orçamento vira certeza',
        text: 'Sem buraco no fluxo de caixa, manutenção, obras e melhorias saem do papel no prazo combinado em assembleia.',
      },
      {
        title: 'O síndico dorme tranquilo',
        text: 'Nada de lista de devedores na porta do elevador nem assembleia tensa. A relação entre vizinhos fica preservada.',
      },
    ],
  }

  // `.g-one`, `_reference/garante.html:143-165,336-342` — o "1%" tipográfico
  // gigante (bloco novo, ver `PriceMoment/config.ts`).
  const garantePrecoMomento: Omit<PriceMomentBlock, 'id' | 'blockName'> = {
    blockType: 'priceMoment',
    value: '1%',
    sub: 'da arrecadação. Só isso.',
    fine: 'Sem taxa de adesão, sem carência escondida, sem pegadinha no contrato. O custo se paga na primeira obra que sai do papel.',
  }

  // `.g-compare.sec-light.white`, `_reference/garante.html:167-195,345-373`
  // — os 2 cartões antes/depois (bloco novo, ver `Compare/config.ts`).
  const garanteCompare: Omit<CompareBlock, 'id' | 'blockName'> = {
    blockType: 'compare',
    title: 'A diferença no dia a dia.',
    before: {
      tag: 'Sem o Garante',
      items: [
        { text: 'Receita imprevisível, refém dos atrasos do mês' },
        { text: 'Síndico constrangido cobrando vizinho' },
        { text: 'Obras adiadas por falta de caixa' },
        { text: 'Rateio extra para cobrir buracos' },
        { text: 'Assembleias dominadas pela pauta da inadimplência' },
      ],
    },
    after: {
      tag: 'Com o Semog Garante',
      items: [
        { text: '100% da arrecadação garantida em contrato' },
        { text: 'Cobrança profissional, sem envolver o síndico' },
        { text: 'Manutenção e obras dentro do cronograma' },
        { text: 'Zero rateio extra por inadimplência' },
        { text: 'Assembleias para decidir o futuro, não o débito' },
      ],
    },
  }

  // `.g-partner.sec-light`, `_reference/garante.html:197-201,376-392` —
  // "Quem garante a garantia" (bloco novo, ver `PartnerSplit/config.ts`).
  const garantePartner: Omit<PartnerSplitBlock, 'id' | 'blockName'> = {
    blockType: 'partnerSplit',
    title: 'Quem garante a garantia.',
    text: 'O Semog Garante é operado em parceria com a G5 Partners, especialista em soluções financeiras para o mercado condominial. A Semog cuida da gestão e do relacionamento; a G5, da estrutura de capital que assegura o repasse integral. O condomínio assina um contrato só e recebe de um parceiro só.',
    highlight: 'G5 Partners',
  }

  // `.faq`, `_reference/garante.html:203-220,395-417` — FAQ em `--bg-deep`
  // ESCURO (ao contrário do `.faq.sec-light` claro de `/solucoes`/
  // `administracao-de-condominios`, daí `dark: true`).
  const garanteFaq: Omit<FaqBlock, 'id' | 'blockName'> = {
    blockType: 'faq',
    title: 'Perguntas diretas, respostas diretas.',
    dark: true,
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

  // `.final-cta`, `_reference/garante.html:222-224,420-431` — CTA final
  // centrado (`variant: 'centered'`, ao contrário do grad-band default).
  const garanteCtaBand: Omit<CTABandBlock, 'id' | 'blockName'> = {
    blockType: 'ctaBand',
    variant: 'centered',
    title: 'Quanto vale nunca mais se preocupar com a arrecadação?',
    text: 'Envie os dados do condomínio e receba a simulação do Garante em até 24 horas úteis.',
    cta: { label: 'Solicitar proposta', href: '/proposta' },
  }

  await upsertPage(payload, {
    title: 'Semog Garante',
    slug: 'garante',
    layout: [
      garanteHero,
      garanteTicker,
      garanteProblema,
      garanteComoFunciona,
      garantePrecoMomento,
      garanteCompare,
      garantePartner,
      garanteFaq,
      garanteCtaBand,
    ],
  })
}

// ===== "Incorporadoras" (slug `incorporadoras`), fiel a
// `_reference/incorporadoras.html`: Hero (`.page-hero` 80dvh, opacidade
// 0.55, `incorporadoras.webp`) + WordsSection `variant:'argument'`
// (`.argument`) + ProcessoTimeline (`.proc-list`, timeline vertical, bloco
// novo) + FeatureGrid (`.why-grid.sec-light.white`, glifo SVG, 2 colunas,
// stagger) + DevQuote (`.dev-quote`, bloco novo) + CTABand `centered` com
// `buttonVariant:'primary'` (o `.final-cta` deste ref usa `.btn-primary`,
// não `.btn-white`). Ordem exata do ref; sem a faixa `Registros` que o seed
// antigo inseria (não existe no ref). =====

async function seedIncorporadorasPage(payload: Awaited<ReturnType<typeof getPayload>>) {
  const incorporadorasPosterId = await getMediaId(payload, 'incorporadoras.webp')

  // `.page-hero`, `_reference/incorporadoras.html:50-70`: números próprios
  // desta página (80dvh, opacidade 0.55, `background-position: center`,
  // gradiente com parada intermediária a 45% — mesmo padrão dos 4 campos
  // `pageHero*` dedicados em `Hero/config.ts`, já usados por
  // `/administracao-de-condominios`).
  const incorporadorasHero: Omit<HeroBlock, 'id' | 'blockName'> = {
    blockType: 'hero',
    headline: 'O condomínio nasce bem antes das chaves.',
    subhead:
      'A Semog implanta o condomínio da sua incorporadora da planta à primeira assembleia, protegendo a entrega, o cliente e a sua marca.',
    poster: incorporadorasPosterId,
    pageHeroOverlay: true,
    pageHeroMinHeight: '80dvh',
    pageHeroPosterOpacity: 0.55,
    pageHeroBgPosition: 'center',
    pageHeroGradient:
      'linear-gradient(180deg, rgba(5,8,26,0.5) 0%, rgba(10,16,46,0.3) 45%, var(--color-navy-900) 100%)',
    ctas: [{ label: 'Solicitar proposta', href: '/proposta' }],
  }

  // `.argument`, `_reference/incorporadoras.html:72-79,204-216` — o
  // parágrafo-manifesto (`text`, scrub via `Words`) + `sub` (2º parágrafo,
  // `Reveal` simples). `<em>` do ref descartado (texto puro), mesma
  // limitação documentada em `WordsSection/config.ts`.
  const incorporadorasArgumento: Omit<WordsSectionBlock, 'id' | 'blockName'> = {
    blockType: 'wordsSection',
    variant: 'argument',
    text: 'A experiência do comprador não termina na escritura. Os primeiros doze meses do condomínio definem como a sua marca será lembrada.',
    sub: 'Condomínio recém-entregue com taxa mal calculada, assembleia tumultuada e áreas comuns sem manutenção vira reclamação pública contra a incorporadora. Com 35 anos de implantações, a Semog garante que a vida no empreendimento comece tão bem quanto a obra terminou.',
  }

  // `.process.sec-light`, `_reference/incorporadoras.html:81-107,218-278` —
  // timeline vertical dos 5 passos (bloco novo, ver `ProcessoTimeline/
  // config.ts`). `iconSvg` de cada item é o markup verbatim do ref
  // (viewBox 24x24).
  const incorporadorasProcesso: Omit<ProcessoTimelineBlock, 'id' | 'blockName'> = {
    blockType: 'processoTimeline',
    eyebrow: 'Como trabalhamos',
    title: 'Da planta à primeira assembleia.',
    items: [
      {
        iconSvg: '<path d="M3 3v18h18"/><path d="M7 15l4-6 4 3 5-8"/>',
        title: 'Previsão orçamentária ainda na planta',
        text: 'Calculamos a taxa condominial realista antes do lançamento, evitando a armadilha da taxa promocional que explode no segundo ano. Sua equipe de vendas divulga um número que se sustenta.',
        tags: [
          { label: 'Estudo de custos' },
          { label: 'Dimensionamento de equipe' },
          { label: 'Benchmark regional' },
        ],
      },
      {
        iconSvg:
          '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
        title: 'Convenção e regimento sob medida',
        text: 'Elaboramos convenção, regimento interno e estrutura jurídica adequados ao perfil do empreendimento, prontos para registro e alinhados ao memorial de incorporação.',
        tags: [{ label: 'Assessoria jurídica' }, { label: 'Registro em cartório' }],
      },
      {
        iconSvg:
          '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
        title: 'Assembleia de instalação conduzida',
        text: 'Organizamos e conduzimos a assembleia que dá vida jurídica ao condomínio: eleição do síndico, aprovação da previsão e posse da administração, sem tumulto e com ata impecável.',
        tags: [
          { label: 'Convocação legal' },
          { label: 'Condução profissional' },
          { label: 'CNPJ do condomínio' },
        ],
      },
      {
        iconSvg:
          '<path d="M21 10H3M16 2v4M8 2v4M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/>',
        title: 'Entrega das unidades organizada',
        text: 'Estruturamos o calendário de vistorias e entrega de chaves junto à sua equipe, com contratação de pessoal, implantação de portaria e áreas comuns operando desde o primeiro morador.',
        tags: [
          { label: 'Vistorias' },
          { label: 'Implantação de equipe' },
          { label: 'Manual do morador' },
        ],
      },
      {
        iconSvg:
          '<path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6Z"/><path d="m9 12 2 2 4-4"/>',
        title: 'Pós-obra sem atrito',
        text: 'Fazemos a ponte entre condomínio e construtora na fase de garantias: chamados técnicos documentados, prazos monitorados e comunicação que evita o desgaste público da sua marca.',
        tags: [
          { label: 'Gestão de garantias' },
          { label: 'Mediação técnica' },
          { label: 'Relatórios à incorporadora' },
        ],
      },
    ],
  }

  // `.why-grid.sec-light.white`, `_reference/incorporadoras.html:109-122,
  // 280-309` — os 4 cards de "O que a sua incorporadora ganha" (mesmo
  // `.why-card` do variant `dark`, dentro de `Section light white`, 2
  // colunas, glifo SVG nu, entrada em grupo — ver doc dos campos em
  // `FeatureGrid/config.ts`).
  const incorporadorasGanhos: Omit<FeatureGridBlock, 'id' | 'blockName'> = {
    blockType: 'featureGrid',
    light: true,
    white: true,
    columns: '2',
    stagger: true,
    title: 'O que a sua incorporadora ganha.',
    titleAccent: 'ganha.',
    features: [
      {
        iconSvg: '<path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6Z"/>',
        title: 'Reputação protegida',
        description:
          'Condomínio bem implantado significa comprador satisfeito falando bem do empreendimento nas redes e para amigos. O melhor marketing do próximo lançamento.',
      },
      {
        iconSvg: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
        title: 'Time liberado para construir',
        description:
          'Sua equipe de engenharia e relacionamento para de responder sobre taxa de condomínio e volta a fazer o que sabe: entregar obra.',
      },
      {
        iconSvg: '<path d="M3 3v18h18"/><path d="M7 15l4-6 4 3 5-8"/>',
        title: 'Números desde o dia zero',
        description:
          'Previsão orçamentária auditável e prestação de contas digital desde a instalação. O conselho do condomínio nasce confiando na gestão.',
      },
      {
        iconSvg:
          '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
        title: 'Um parceiro em quatro praças',
        description:
          'Lançou em Recife, João Pessoa, Campina Grande ou Belém? A mesma Semog implanta, com equipe local e padrão único de qualidade.',
      },
    ],
  }

  // `.dev-quote`, `_reference/incorporadoras.html:125-136,311-317` (bloco
  // novo, ver `DevQuote/config.ts`). `<em>` do ref descartado (texto puro).
  const incorporadorasQuote: Omit<DevQuoteBlock, 'id' | 'blockName'> = {
    blockType: 'devQuote',
    quote: 'Entregar a obra é metade. A Semog entrega a convivência.',
    cite: 'Filosofia do time de implantação Semog',
  }

  // `.final-cta`, `_reference/incorporadoras.html:138-140,319-331` — CTA
  // final centrado com `.btn-primary` (não `.btn-white` como
  // home/garante/administracao — daí `buttonVariant:'primary'`).
  const incorporadorasCtaBand: Omit<CTABandBlock, 'id' | 'blockName'> = {
    blockType: 'ctaBand',
    variant: 'centered',
    buttonVariant: 'primary',
    title: 'Tem lançamento no radar?',
    text: 'Envolva a Semog ainda na planta e lance com a taxa certa, a convenção certa e a operação pronta.',
    cta: { label: 'Solicitar proposta', href: '/proposta' },
  }

  await upsertPage(payload, {
    title: 'Para Incorporadoras',
    slug: 'incorporadoras',
    layout: [
      incorporadorasHero,
      incorporadorasArgumento,
      incorporadorasProcesso,
      incorporadorasGanhos,
      incorporadorasQuote,
      incorporadorasCtaBand,
    ],
  })
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
// fiéis a `_reference/administradora-de-condominios-*.html` — as 4 páginas
// são um único template (`<head>`/`<style>`/nav/footer byte-idênticos,
// confirmado em `.superpowers/sdd/audit-cidades.md`), 9 seções na ordem do
// ref: Hero → Números → Unidade → Bairros → Serviços → Banda Garante →
// Depoimentos+Creds → FAQ → CTA final. =====

type CityLandingTestimonial = { quote: string; author: string; role: string }

type CityLandingInput = {
  slug: string
  city: string
  role: 'Matriz' | 'Filial'
  uf: string
  ufFull: string
  heroSubhead: string
  /** Filename já semeado por `pnpm seed:media` (ver `MEDIA_ASSETS`). */
  cityPhotoFilename: string
  neighborhood: string
  /** 1ª linha do endereço (`<dd>`), ex.: "Av. Conselheiro Aguiar, 1000 · Sala 501". */
  addressMain: string
  /** 2ª linha do endereço (`<small>`), ex.: "Boa Viagem · Recife/PE · CEP 51011-000". */
  addressDetail: string
  phone: string
  /** Dígitos puros, usado no link `wa.me` (CTA "Chamar no WhatsApp"). */
  whatsapp: string
  /** Telefone formatado da linha "WhatsApp" do `dl`, ex.: "(81) 9 9999-9999". */
  whatsappDisplay: string
  /** Href do CTA "Como chegar", ex.: "https://maps.google.com/?q=Semog+recife". */
  mapsHref: string
  /** `.hood-pills` — bairros de forte presença. */
  neighborhoodPills: string[]
  /** `.hood .note` — "Também atendemos ...", reaproveitado na 2ª pergunta do FAQ. */
  alsoServedNote: string
  /** Parágrafo de apresentação de `.svc-sec` (`FeatureGrid.intro`). */
  servicosIntro: string
  testimonials: [CityLandingTestimonial, CityLandingTestimonial]
}

/** Horário fiel ao `dl` `.unit-rows` — idêntico nas 4 landings do ref. */
const CITY_HOURS = 'Segunda a sexta, das 8h às 18h'

/**
 * Junta uma lista ao estilo PT-BR "A, B e C" — fiel ao `.hood-pills`/FAQ
 * "com forte presença em X, Y e Z" do ref (ao contrário do "Também
 * atendemos ..." de `alsoServedNote`, que o próprio ref junta só com
 * vírgulas, sem "e" — por isso não usa este helper, fica como texto literal).
 */
function joinPt(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`
}

// Os 7 itens de `.svc-rows` são idênticos nas quatro páginas do `_reference`
// — só o parágrafo de apresentação (`servicosIntro`, acima) muda por
// cidade. `badge` reproduz os 2 selos inline do ref ("EXCLUSIVA"/"1% AO MÊS",
// `_reference/administradora-de-condominios-recife.html:368,373`).
const cityServicos: NonNullable<FeatureGridBlock['features']> = [
  { title: 'Gestão financeira e cobrança' },
  { title: 'Prestação de contas 100% digital', badge: 'EXCLUSIVA' },
  { title: 'Folha e RH dos funcionários' },
  { title: 'Assessoria jurídica condominial' },
  { title: 'Assembleias presenciais e digitais' },
  { title: 'Aplicativo para moradores e síndicos' },
  { title: 'Semog Garante: inadimplência zero', badge: '1% AO MÊS' },
]

// `.mini-stats` — 4 números idênticos nas quatro páginas do `_reference`
// (`_reference/administradora-de-condominios-recife.html:301-310`).
const cityStats: NonNullable<StatsBlock['items']> = [
  { value: 35, label: 'Anos de mercado' },
  { value: 700, prefix: '+', label: 'Condomínios' },
  { value: 70, prefix: '+', suffix: 'mil', label: 'Clientes' },
  { value: 100, prefix: '+', label: 'Especialistas' },
]

// Q3/Q4 do FAQ são byte-idênticas nas 4 páginas do `_reference` (só o nome
// da cidade muda na pergunta de Q3, nunca na resposta; Q4 nem isso).
const CITY_FAQ_QUANTO_CUSTA_ANSWER =
  'Depende do porte do condomínio e dos serviços. Envie os dados do seu condomínio e receba uma proposta personalizada em até 24 horas úteis, sem compromisso.'
const CITY_FAQ_TROCA_QUESTION = 'Como funciona a troca de administradora?'
const CITY_FAQ_TROCA_ANSWER =
  'Aprovada a troca em assembleia, a equipe local conduz a migração completa: documentos, comunicação aos condôminos e transição financeira, sem interromper boletos nem pagamentos.'

async function seedCityLanding(
  payload: Awaited<ReturnType<typeof getPayload>>,
  input: CityLandingInput,
) {
  const cityPhotoId = await getMediaId(payload, input.cityPhotoFilename)
  const chip = `${input.role} · ${input.uf}`

  // `.page-hero`, fiel a `_reference/administradora-de-condominios-recife.html:65-91,284-298`.
  const hero: Omit<HeroBlock, 'id' | 'blockName'> = {
    blockType: 'hero',
    eyebrow: `Semog ${input.city} · ${input.role} · ${input.ufFull}`,
    headline: `Administradora de condomínios em ${input.city}.`,
    subhead: input.heroSubhead,
    poster: cityPhotoId,
    pageHeroOverlay: true,
    pageHeroMinHeight: '86dvh',
    pageHeroPosterOpacity: 0.5,
    pageHeroBgPosition: 'center 35%',
    pageHeroGradient:
      'linear-gradient(180deg, rgba(5,8,26,0.5) 0%, rgba(10,16,46,0.3) 50%, var(--color-navy-950) 100%)',
    ctas: [{ label: 'Solicitar proposta', href: '/proposta', variant: 'white' }],
  }

  // `.mini-stats-sec`, fiel a `_reference/administradora-de-condominios-recife.html:300-310`.
  const stats: Omit<StatsBlock, 'id' | 'blockName'> = {
    blockType: 'stats',
    items: cityStats,
  }

  // `.unit-sec` (cartão rico), fiel a `_reference/administradora-de-condominios-recife.html:110-140,312-338`.
  const contactInfo: Omit<ContactInfoBlock, 'id' | 'blockName'> = {
    blockType: 'contactInfo',
    variant: 'card',
    eyebrow: `Nossa unidade em ${input.city}`,
    title: `De portas abertas em ${input.neighborhood}.`,
    titleAccent: `em ${input.neighborhood}.`,
    items: [
      {
        city: input.city,
        uf: input.uf,
        address: input.addressMain,
        addressDetail: input.addressDetail,
        phone: input.phone,
        whatsappDisplay: input.whatsappDisplay,
        hours: CITY_HOURS,
        chip,
        photo: cityPhotoId,
        mapsHref: input.mapsHref,
      },
    ],
    whatsapp: input.whatsapp,
  }

  // `.hood` (bloco novo), fiel a `_reference/administradora-de-condominios-recife.html:142-156,340-356`.
  const bairros: Omit<BairrosBlock, 'id' | 'blockName'> = {
    blockType: 'bairros',
    title: `Bairros com condomínios Semog em ${input.city}`,
    items: input.neighborhoodPills.map((label) => ({ label })),
    note: input.alsoServedNote,
  }

  // `.svc-sec` (variant rows), fiel a `_reference/administradora-de-condominios-recife.html:158-174,358-380`.
  const servicos: Omit<FeatureGridBlock, 'id' | 'blockName'> = {
    blockType: 'featureGrid',
    variant: 'rows',
    title: `Gestão feita por quem conhece ${input.city}.`,
    titleAccent: `conhece ${input.city}.`,
    intro: input.servicosIntro,
    features: cityServicos,
    moreLink: { label: 'Ver o serviço completo', href: '/administracao-de-condominios' },
  }

  // `.g-band` (Garante split), fiel a `_reference/administradora-de-condominios-recife.html:176-190,382-402`.
  const garanteBand: Omit<GaranteBlock, 'id' | 'blockName'> = {
    blockType: 'garante',
    title: `Inadimplência zero também em ${input.city}.`,
    text: 'O Semog Garante assegura a arrecadação integral do condomínio em contrato. A cobrança é problema nosso, nunca do síndico.',
    cta: { label: 'Conhecer o Semog Garante', href: '/garante' },
    pct: { value: '1%', label: 'da arrecadação. Só isso.' },
  }

  // `.depo`, fiel a `_reference/administradora-de-condominios-recife.html:404-419`.
  const depoimentos: Omit<TestimonialsBlock, 'id' | 'blockName'> = {
    blockType: 'testimonials',
    eyebrow: `Quem já é Semog em ${input.city}`,
    items: input.testimonials,
  }

  // `.creds`, fiel a `_reference/administradora-de-condominios-recife.html:420-429`. `light`
  // (sem `white`) porque o ref aninha `.creds` dentro da mesma `.depo.sec-light` acima.
  const registros: Omit<RegistrosBlock, 'id' | 'blockName'> = {
    blockType: 'registros',
    light: true,
    title:
      'A Semog é registrada nos órgãos do setor e associada às entidades do mercado condominial. Documentação disponível para consulta na unidade.',
    items: [
      { label: `CRECI/${input.uf}` },
      { label: 'ABADI' },
      { label: 'SECOVI' },
      { label: 'Desde 1991' },
    ],
  }

  // `.faq`, fiel a `_reference/administradora-de-condominios-recife.html:227-235,434-457`.
  // `tightTop` zera o padding-top — a seção cola no `.creds` acima, como no ref.
  const faq: Omit<FaqBlock, 'id' | 'blockName'> = {
    blockType: 'faq',
    title: `Perguntas de quem busca administradora em ${input.city}.`,
    tightTop: true,
    items: [
      {
        question: `Qual a melhor administradora de condomínios de ${input.city}?`,
        answer: `Com 35 anos de mercado, mais de 700 condomínios e 70 mil clientes, a Semog é a administradora líder do Nordeste, com ${input.role.toLowerCase()} em ${input.neighborhood} e a única prestação de contas 100% digital do mercado.`,
      },
      {
        question: 'Quais bairros vocês atendem?',
        answer: `Toda a cidade, com forte presença em ${joinPt(input.neighborhoodPills)}. ${input.alsoServedNote}`,
      },
      {
        question: `Quanto custa uma administradora em ${input.city}?`,
        answer: CITY_FAQ_QUANTO_CUSTA_ANSWER,
      },
      { question: CITY_FAQ_TROCA_QUESTION, answer: CITY_FAQ_TROCA_ANSWER },
    ],
  }

  // `.final-cta`, fiel a `_reference/administradora-de-condominios-recife.html:459-471`.
  const ctaBand: Omit<CTABandBlock, 'id' | 'blockName'> = {
    blockType: 'ctaBand',
    variant: 'centered',
    title: `Seu condomínio em ${input.city} merece a líder.`,
    titleAccent: 'a líder.',
    text: `Fale com a Semog ${input.city} e receba uma proposta sob medida em até 24 horas úteis.`,
    cta: { label: 'Solicitar proposta', href: '/proposta' },
  }

  await upsertPage(payload, {
    title: `Administradora de Condomínios em ${input.city}`,
    slug: input.slug,
    layout: [
      hero,
      stats,
      contactInfo,
      bairros,
      servicos,
      garanteBand,
      depoimentos,
      registros,
      faq,
      ctaBand,
    ],
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
  cityPhotoFilename: 'recife.webp',
  neighborhood: 'Boa Viagem',
  addressMain: 'Av. Conselheiro Aguiar, 1000 · Sala 501',
  addressDetail: 'Boa Viagem · Recife/PE · CEP 51011-000',
  phone: '(81) 0000-0000',
  whatsapp: '5581999999999',
  whatsappDisplay: '(81) 9 9999-9999',
  mapsHref: 'https://maps.google.com/?q=Semog+recife',
  neighborhoodPills: [
    'Boa Viagem',
    'Casa Forte',
    'Espinheiro',
    'Graças',
    'Pina',
    'Madalena',
    'Torre',
    'Parnamirim',
  ],
  alsoServedNote:
    'Também atendemos Olinda, Jaboatão dos Guararapes, Paulista, Região Metropolitana do Recife.',
  servicosIntro:
    'Desde 1991, administramos condomínios em Recife e em toda a Região Metropolitana. Nossa matriz fica na cidade, com atendimento presencial e equipe completa de contabilidade, jurídico, RH e relacionamento.',
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
  cityPhotoFilename: 'joao-pessoa.webp',
  neighborhood: 'Tambaú',
  addressMain: 'Av. Epitácio Pessoa, 500 · Sala 302',
  addressDetail: 'Tambaú · João Pessoa/PB · CEP 58039-000',
  phone: '(83) 0000-0000',
  whatsapp: '5583999999999',
  whatsappDisplay: '(83) 9 9999-9999',
  mapsHref: 'https://maps.google.com/?q=Semog+joao+pessoa',
  neighborhoodPills: [
    'Manaíra',
    'Tambaú',
    'Cabo Branco',
    'Bessa',
    'Altiplano',
    'Bancários',
    'Intermares',
  ],
  alsoServedNote: 'Também atendemos Cabedelo, Bayeux, Santa Rita, Grande João Pessoa.',
  servicosIntro:
    'A filial de João Pessoa atende a orla e toda a Grande João Pessoa com equipe da cidade e o mesmo padrão de governança da matriz: prestação de contas digital, aplicativo completo e acesso direto aos sócios.',
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
  cityPhotoFilename: 'campina-grande.webp',
  neighborhood: 'Centro',
  addressMain: 'Rua Maciel Pinheiro, 200 · Sala 104',
  addressDetail: 'Centro · Campina Grande/PB · CEP 58400-000',
  phone: '(83) 0000-0000',
  whatsapp: '5583999999999',
  whatsappDisplay: '(83) 9 9999-9999',
  mapsHref: 'https://maps.google.com/?q=Semog+campina+grande',
  neighborhoodPills: ['Catolé', 'Mirante', 'Alto Branco', 'Centro', 'Bela Vista', 'Prata'],
  alsoServedNote: 'Também atendemos Queimadas, Lagoa Seca.',
  servicosIntro:
    'Nossa filial de Campina Grande une o conhecimento da Rainha da Borborema à estrutura da líder do Nordeste: tecnologia própria, prestação de contas digital e uma equipe que resolve na primeira ligação.',
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
  cityPhotoFilename: 'belem.webp',
  neighborhood: 'Umarizal',
  addressMain: 'Av. Visconde de Souza Franco, 300 · Sala 205',
  addressDetail: 'Umarizal · Belém/PA · CEP 66053-000',
  phone: '(91) 0000-0000',
  whatsapp: '5591999999999',
  whatsappDisplay: '(91) 9 9999-9999',
  mapsHref: 'https://maps.google.com/?q=Semog+belem',
  neighborhoodPills: ['Umarizal', 'Nazaré', 'Batista Campos', 'Marco', 'Reduto', 'São Brás'],
  alsoServedNote: 'Também atendemos Ananindeua, Marituba, Região Metropolitana de Belém.',
  servicosIntro:
    'Em Belém, a Semog leva ao Norte o método construído em 35 anos: prestação de contas 100% digital, aplicativo completo, Semog Garante e uma equipe paraense com autonomia de verdade.',
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

  await seedSemogPage(payload)

  await seedSolucoesPage(payload)

  await seedAdministracaoPage(payload)

  await seedGarantePage(payload)

  await seedIncorporadorasPage(payload)

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
