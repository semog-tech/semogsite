import config from '@payload-config'
import { getPayload } from 'payload'
import type {
  AppShowcaseBlock,
  CitiesBlock,
  CTABandBlock,
  GaranteBlock,
  HeroBlock,
  HumanQuoteBlock,
  PillarsBlock,
  ProdutosGridBlock,
  SolucoesBentoBlock,
  StatsBlock,
  ValuesMarqueeBlock,
  WordsSectionBlock,
} from '@/payload-types'
import { getMediaId } from './lib/media'

// Mesmo número usado em `src/seed/pages.ts` (globals/ContactInfo/TrustPanel) —
// a home é conteúdo estático de seed, não lê o global `company` em runtime,
// então o número fica hardcoded aqui também. Dígitos puros, ver `wa.me`.
const WHATSAPP_URL = 'https://wa.me/551130034506'

/**
 * Seed idempotente da Page `home`.
 *
 * Até jul/2026 este seed reproduzia `_reference/index.html` em fidelidade
 * total (11 blocos, ver histórico em `.superpowers/sdd/fidelity-diagnosis.md`
 * seção A.1). A partir do redesign da Home (Plano 2 do `redesign/02-home`),
 * a home DIVERGE deliberadamente do `_reference`: ganhou uma faixa de prova
 * no hero, os stats viraram faixa horizontal, os pilares viraram colunas e
 * o aplicativo ganhou seção própria — nenhuma dessas mudanças existe no
 * `_reference`, que passa a valer só para as páginas ainda não redesenhadas.
 *
 * Ordem atual, 12 blocos (a 13ª seção visual é o Footer, um global fora do
 * `layout`):
 *
 * 1. **Hero** (`.hero`) — headline/subhead/CTAs + `proofItems` (faixa de
 *    prova: nota do app, condomínios, clientes, anos de mercado — substitui
 *    a antiga `tag`), fundo `background: 'videoSequence'`.
 * 2. **Stats** (`.stats-grid`) variante `band` — faixa horizontal de 5,
 *    sem o mapa do Brasil que a variante `feature` usava.
 * 3. **ValuesMarquee** (`.values-strip`) — TRANSPARÊNCIA / RETIDÃO / DINÂMICA.
 * 4. **WordsSection** (`.manifesto`) — parágrafo com scrub palavra-a-palavra.
 * 5. **Pillars** (`.pillars`) variante `columns` — grade auto-fit, no lugar
 *    das 3 `.pillar-row` empilhadas.
 * 6. **SolucoesBento** (`.solutions`) — bento Residencial (alto) + Comercial +
 *    Associações, com `residencial.webp`/`comercial.webp`/`associacoes.webp`.
 * 7. **ProdutosGrid** (`.prods.sec-light.white`) — 4 `.prod-card` (Prestação de
 *    Contas on-white, Semog Garante on-navy, Aplicativo on-deep → agora aponta
 *    para `/aplicativo`, Semog One on-white) com
 *    `c-prestacao`/`c-garante`/`c-app`/`c-one.webp`.
 * 8. **AppShowcase** tema `deep` — seção própria do aplicativo, com as duas
 *    telas reais (`app-inicio.webp`/`app-encomenda.webp`), nota das lojas e
 *    selos (`StoreBadges`). Novo nesta ordem.
 * 9. **Garante** variante banda (`.g-band-home`) — vídeo `garante.mp4` com
 *    poster `garante.webp`, chip de vidro "1%".
 * 10. **Cities** (`.cities-acc`) — 4 cidades com foto (`recife`/`joao-pessoa`/
 *    `campina-grande`/`belem.webp`); UF por extenso, como no ref.
 * 11. **HumanQuote** (`.human`) — citação + foto `equipe.webp` em parallax.
 * 12. **CTABand** variante `centered` (`.final-cta`) — CTA final da home,
 *    agora com `secondaryCta` (WhatsApp) ao lado do CTA principal.
 *
 * `testimonials` entra aqui, entre `garante` e `cities`, assim que houver 3
 * depoimentos reais com nome, cargo, condomínio e cidade autorizados pelo
 * cliente. Depoimento inventado num site que vende confiança é pior que
 * seção nenhuma — ver seção 8 da spec.
 *
 * Toda mídia é resolvida via `getMediaId(payload, filename)`
 * (`src/seed/lib/media.ts`), que busca o `id` do doc `media` já semeado por
 * `pnpm seed:media` — lança se o asset não existir (não inventa ids).
 */

// `\n` reproduz o `<br>` literal de `_reference/index.html:491`
// (`Preocupe-se apenas<br>em morar.`) — `src/motion/Chars.tsx` insere uma
// quebra de linha real no lugar, ver doc do componente.
const HERO_HEADLINE = 'Preocupe-se apenas\nem morar.'

async function seedHome() {
  const payload = await getPayload({ config })

  const [
    residencialId,
    comercialId,
    associacoesId,
    cPrestacaoId,
    cGaranteId,
    cAppId,
    cOneId,
    garanteVideoId,
    garantePosterId,
    recifeId,
    joaoPessoaId,
    campinaGrandeId,
    belemId,
    equipeId,
    appTela1Id,
    appTela2Id,
  ] = await Promise.all([
    getMediaId(payload, 'residencial.webp'),
    getMediaId(payload, 'comercial.webp'),
    getMediaId(payload, 'associacoes.webp'),
    getMediaId(payload, 'c-prestacao.webp'),
    getMediaId(payload, 'c-garante.webp'),
    getMediaId(payload, 'c-app.webp'),
    getMediaId(payload, 'c-one.webp'),
    getMediaId(payload, 'garante.mp4'),
    getMediaId(payload, 'garante.webp'),
    getMediaId(payload, 'recife.webp'),
    getMediaId(payload, 'joao-pessoa.webp'),
    getMediaId(payload, 'campina-grande.webp'),
    getMediaId(payload, 'belem.webp'),
    getMediaId(payload, 'equipe.webp'),
    getMediaId(payload, 'app-inicio.webp'),
    getMediaId(payload, 'app-encomenda.webp'),
  ])

  const heroBlock: Omit<HeroBlock, 'id' | 'blockName'> = {
    blockType: 'hero',
    headline: HERO_HEADLINE,
    subhead: 'Há 35 anos, a líder do Nordeste cuida do condomínio para você cuidar da vida.',
    background: 'videoSequence',
    // Substitui a antiga `tag` (`.hero-tagbox`) — mesma faixa de vidro, agora
    // com prova em número em vez de só um rótulo.
    proofItems: [
      { value: '4,8', label: 'no app, 1.133 avaliações', stars: true },
      { value: '+650', label: 'condomínios sob gestão' },
      { value: '+70 mil', label: 'clientes atendidos' },
      { value: '35 anos', label: 'em 3 estados, desde 1991' },
    ],
    ctas: [
      { label: 'Solicitar proposta', href: '/proposta', variant: 'white' },
      { label: 'Ver o aplicativo', href: '/aplicativo', variant: 'glass' },
    ],
  }

  const statsBlock: Omit<StatsBlock, 'id' | 'blockName'> = {
    blockType: 'stats',
    eyebrow: 'A líder do Nordeste',
    title: 'Liderança não se declara. Se comprova.',
    variant: 'band',
    items: [
      { value: 35, label: 'Anos de mercado', detail: 'Desde 1991, sempre no Nordeste.' },
      {
        value: 650,
        prefix: '+',
        label: 'Condomínios',
        detail: 'Sob gestão completa, mês após mês.',
      },
      {
        value: 70,
        prefix: '+',
        suffix: 'mil',
        label: 'Clientes',
        detail: 'Famílias e empresas que confiam.',
      },
      {
        value: 100,
        prefix: '+',
        label: 'Especialistas',
        detail: 'Time próprio: financeiro, jurídico, contábil.',
      },
      { value: 3, label: 'Estados', detail: 'Pernambuco, Paraíba e Pará.' },
    ],
  }

  const valuesMarqueeBlock: Omit<ValuesMarqueeBlock, 'id' | 'blockName'> = {
    blockType: 'valuesMarquee',
    items: ['TRANSPARÊNCIA', 'RETIDÃO', 'DINÂMICA'],
    separator: '/',
  }

  const wordsSectionBlock: Omit<WordsSectionBlock, 'id' | 'blockName'> = {
    blockType: 'wordsSection',
    text: 'Condomínio bem administrado é aquele que ninguém percebe. A vida acontece dentro dele, e nós cuidamos de todo o resto.',
  }

  const pillarsBlock: Omit<PillarsBlock, 'id' | 'blockName'> = {
    blockType: 'pillars',
    variant: 'columns',
    items: [
      {
        title: 'Condomínios',
        text: 'Gestão completa de comunidades residenciais, comerciais e associações, do financeiro à assembleia.',
      },
      {
        title: 'Métricas',
        text: 'Decisões guiadas por dados: indicadores, gráficos e relatórios que todo condômino entende.',
      },
      {
        title: 'Organização',
        text: 'Processos claros, prazos cumpridos e documentação impecável, sempre ao seu alcance.',
      },
    ],
  }

  const solucoesBentoBlock: Omit<SolucoesBentoBlock, 'id' | 'blockName'> = {
    blockType: 'solucoesBento',
    eyebrow: 'Soluções',
    title: 'Uma gestão para cada comunidade.',
    cards: [
      {
        image: residencialId,
        title: 'Residenciais',
        text: 'Financeiro, RH, manutenção, assembleias e comunicação. O prédio funciona, o morador vive.',
        href: '/solucoes#residenciais',
        tall: true,
      },
      {
        image: comercialId,
        title: 'Comerciais',
        text: 'Previsibilidade e rateios impecáveis para edifícios corporativos.',
        href: '/solucoes#comerciais',
      },
      {
        image: associacoesId,
        title: 'Associações',
        text: 'Governança sob medida para loteamentos e clubes.',
        href: '/solucoes#associacoes',
      },
    ],
  }

  const produtosGridBlock: Omit<ProdutosGridBlock, 'id' | 'blockName'> = {
    blockType: 'produtosGrid',
    eyebrow: 'O sistema Semog',
    title: 'Quatro produtos que nenhuma outra oferece juntos.',
    cards: [
      {
        image: cPrestacaoId,
        theme: 'on-white',
        tag: 'Prestação de Contas Digital',
        title: 'O balancete que todos os condôminos entendem.',
        text: '100% digital, com documentos anexados, gráficos claros e assinatura digital com validade jurídica.',
        href: '/solucoes#prestacao',
      },
      {
        image: cGaranteId,
        theme: 'on-navy',
        tag: 'Semog Garante · com G5 Partners',
        title: 'Inadimplência zero por 1% da arrecadação.',
        text: 'O condomínio recebe 100% da arrecadação prevista, todos os meses. A cobrança vira problema nosso.',
        href: '/garante',
      },
      {
        image: cAppId,
        theme: 'on-deep',
        tag: 'Aplicativo Semog · 4,8 ★',
        title: 'O condomínio inteiro na palma da mão.',
        text: 'Boletos, reservas, assembleias e avisos em uma interface que o morador realmente usa.',
        href: '/aplicativo',
      },
      {
        image: cOneId,
        theme: 'on-white',
        tag: 'Semog One',
        title: 'A plataforma própria que construímos sobre o nosso ERP.',
        text: 'Equipe de desenvolvimento própria e uma plataforma única que evolui toda semana.',
        href: '/solucoes#tecnologia',
      },
    ],
  }

  // Seção própria do app, tema `deep` (Task 5 do Plano 2). As duas telas são
  // prints reais das lojas com o nome do condomínio de demonstração ("Teste
  // Gruvi") apagado — provisórios até o cliente regravar prints limpos do
  // app em produção (ver comentário em `src/seed/lib/media.ts`).
  const appShowcaseBlock: Omit<AppShowcaseBlock, 'id' | 'blockName'> = {
    blockType: 'appShowcase',
    theme: 'deep',
    eyebrow: 'Aplicativo Semog',
    title: 'O condomínio inteiro na palma da mão.',
    text: 'Boleto, reserva, assembleia, encomenda e portaria. O morador resolve sozinho, sem ligar para a administradora.',
    image: appTela1Id,
    imageSecondary: appTela2Id,
    features: [
      { title: 'Taxa do condomínio', description: 'Boleto do mês, 2ª via e comprovante.' },
      { title: 'Reserva de áreas comuns', description: 'Calendário com o que está livre.' },
      { title: 'Assembleia virtual', description: 'Participação e voto pelo aplicativo.' },
      { title: 'Encomendas', description: 'Aviso de chegada e QR de retirada.' },
      { title: 'Visitantes e prestadores', description: 'Liberação por link, antes de chegar.' },
      { title: 'Documentos e comunicados', description: 'Convenção, atas e avisos oficiais.' },
    ],
    rating: { score: '4,8', label: '1.133 avaliações na App Store e no Google Play' },
    stores: {
      appStore: 'https://apps.apple.com/br/app/semog-condom%C3%ADnios/id6504202916',
      playStore: 'https://play.google.com/store/apps/details?id=br.com.semog',
    },
    cta: { label: 'Conhecer o app', href: '/aplicativo' },
  }

  const garanteBlock: Omit<GaranteBlock, 'id' | 'blockName'> = {
    blockType: 'garante',
    eyebrow: 'Semog Garante',
    title: 'A receita do condomínio, blindada.',
    video: garanteVideoId,
    poster: garantePosterId,
    cta: { label: 'Conhecer o Semog Garante', href: '/garante' },
    priceChip: { value: '1%', label: 'da arrecadação. Sem adesão, sem letra miúda.' },
  }

  const citiesBlock: Omit<CitiesBlock, 'id' | 'blockName'> = {
    blockType: 'cities',
    eyebrow: 'Presença',
    title: 'Do Nordeste ao Norte, perto de você.',
    items: [
      { city: 'Recife', uf: 'Pernambuco', role: 'Matriz', image: recifeId },
      { city: 'João Pessoa', uf: 'Paraíba', role: 'Filial', image: joaoPessoaId },
      { city: 'Campina Grande', uf: 'Paraíba', role: 'Filial', image: campinaGrandeId },
      { city: 'Belém', uf: 'Pará', role: 'Filial', image: belemId },
    ],
  }

  const humanQuoteBlock: Omit<HumanQuoteBlock, 'id' | 'blockName'> = {
    blockType: 'humanQuote',
    quote: 'Aqui, cliente não fala com protocolo. Fala com sócio.',
    author: 'Regra da casa desde 1991',
    image: equipeId,
    caption: 'Tecnologia na operação. Gente na relação.',
  }

  // `headingMaxWidth`/`headingFontSize` reproduzem `.final-cta h2` de
  // `_reference/index.html:420` (`max-width:16ch`,
  // `font-size:clamp(2.4rem,5.6vw,4.6rem)`) — maior que o genérico `20ch`/
  // tamanho padrão que `theme.css` usa nas outras páginas com `.final-cta`.
  const ctaBandBlock: Omit<CTABandBlock, 'id' | 'blockName'> = {
    blockType: 'ctaBand',
    variant: 'centered',
    title: 'Seu condomínio merece governança de líder.',
    text: 'Receba uma proposta sob medida em até 24 horas úteis.',
    cta: { label: 'Solicitar proposta', href: '/proposta' },
    headingMaxWidth: '16ch',
    headingFontSize: 'clamp(2.4rem, 5.6vw, 4.6rem)',
    // Segundo caminho pra quem não quer preencher formulário — mesmo número
    // usado no site inteiro (ver `WHATSAPP_URL` no topo do arquivo).
    secondaryCta: { label: 'Falar no WhatsApp', href: WHATSAPP_URL },
  }

  const layout = [
    heroBlock,
    statsBlock,
    valuesMarqueeBlock,
    wordsSectionBlock,
    pillarsBlock,
    solucoesBentoBlock,
    produtosGridBlock,
    appShowcaseBlock,
    garanteBlock,
    citiesBlock,
    humanQuoteBlock,
    ctaBandBlock,
  ]

  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    depth: 0,
  })

  const data = {
    title: 'Home',
    slug: 'home',
    _status: 'published' as const,
    layout,
    // Espelha `<title>`/meta description de `_reference/index.html` — o
    // `meta.title` do plugin-seo tem prioridade sobre `title` (rótulo
    // administrativo, "Home") em `buildMetadata` (`src/lib/seo.ts`).
    meta: {
      title: 'Semog | Administradora de Condomínios líder do Nordeste há 35 anos',
      description:
        'Administradora de condomínios em Recife, João Pessoa, Campina Grande e Belém. 650 condomínios, 70 mil clientes, prestação de contas 100% digital e inadimplência zero com o Semog Garante.',
    },
  }

  if (existing.docs[0]) {
    const updated = await payload.update({
      collection: 'pages',
      id: existing.docs[0].id,
      data,
    })
    console.log(`[seed:home] Página "home" atualizada (id=${updated.id}).`)
  } else {
    const created = await payload.create({
      collection: 'pages',
      data,
    })
    console.log(`[seed:home] Página "home" criada (id=${created.id}).`)
  }
}

await seedHome()
