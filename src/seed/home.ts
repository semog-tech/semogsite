import config from '@payload-config'
import { getPayload } from 'payload'
import type {
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

/**
 * Seed idempotente da Page `home`, em fidelidade total à ORDEM e ao CONTEÚDO
 * de `_reference/index.html`, 11 blocos (`.superpowers/sdd/fidelity-diagnosis.md`,
 * seção A.1 — a 12ª seção visual é o Footer, um global fora do `layout`):
 *
 * 1. **Hero** (`.hero`) — headline/subhead/CTAs + `tag` (`.hero-tagbox`),
 *    vídeo de fundo `hero.mp4` com poster `hero-towers.webp`.
 * 2. **Stats** (`.stats-grid`) — 5 contadores (35/+700/+70mil/+100/3 Estados).
 * 3. **ValuesMarquee** (`.values-strip`) — TRANSPARÊNCIA / RETIDÃO / DINÂMICA.
 * 4. **WordsSection** (`.manifesto`) — parágrafo com scrub palavra-a-palavra.
 * 5. **Pillars** (`.pillars`) — 3 `.pillar-row` (Condomínios/Métricas/Organização).
 * 6. **SolucoesBento** (`.solutions`) — bento Residencial (alto) + Comercial +
 *    Associações, com `residencial.webp`/`comercial.webp`/`associacoes.webp`.
 * 7. **ProdutosGrid** (`.prods.sec-light.white`) — 4 `.prod-card` (Prestação de
 *    Contas on-white, Semog Garante on-navy, Aplicativo on-deep, Semog One
 *    on-white) com `c-prestacao`/`c-garante`/`c-app`/`c-one.webp`.
 * 8. **Garante** variante banda (`.g-band-home`) — vídeo `garante.mp4` com
 *    poster `garante.webp`, chip de vidro "1%".
 * 9. **Cities** (`.cities-acc`) — 4 cidades com foto (`recife`/`joao-pessoa`/
 *    `campina-grande`/`belem.webp`); UF por extenso, como no ref.
 * 10. **HumanQuote** (`.human`) — citação + foto `equipe.webp` em parallax.
 * 11. **CTABand** variante `centered` (`.final-cta`) — CTA final da home.
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
    heroVideoId,
    heroPosterId,
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
  ] = await Promise.all([
    getMediaId(payload, 'hero.mp4'),
    getMediaId(payload, 'hero-towers.webp'),
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
  ])

  const heroBlock: Omit<HeroBlock, 'id' | 'blockName'> = {
    blockType: 'hero',
    headline: HERO_HEADLINE,
    subhead: 'Há 35 anos, a líder do Nordeste cuida do condomínio para você cuidar da vida.',
    tag: 'Condomínios. Métricas. Organização.',
    video: heroVideoId,
    poster: heroPosterId,
    ctas: [
      { label: 'Solicitar proposta', href: '/proposta', variant: 'white' },
      { label: 'Conhecer soluções', href: '/solucoes', variant: 'glass' },
    ],
  }

  const statsBlock: Omit<StatsBlock, 'id' | 'blockName'> = {
    blockType: 'stats',
    eyebrow: 'A líder do Nordeste',
    title: 'Liderança não se declara. Se comprova.',
    items: [
      { value: 35, label: 'Anos de mercado' },
      { value: 700, prefix: '+', label: 'Condomínios' },
      { value: 70, prefix: '+', suffix: 'mil', label: 'Clientes' },
      { value: 100, prefix: '+', label: 'Especialistas' },
      { value: 3, label: 'Estados' },
    ],
  }

  const valuesMarqueeBlock: Omit<ValuesMarqueeBlock, 'id' | 'blockName'> = {
    blockType: 'valuesMarquee',
    items: ['TRANSPARÊNCIA', 'RETIDÃO', 'DINÂMICA'],
    separator: '/',
  }

  const wordsSectionBlock: Omit<WordsSectionBlock, 'id' | 'blockName'> = {
    blockType: 'wordsSection',
    text: 'Condomínio bem administrado é aquele que ninguém percebe. Percebe-se a vida que acontece dentro dele. Nós cuidamos de todo o resto.',
  }

  const pillarsBlock: Omit<PillarsBlock, 'id' | 'blockName'> = {
    blockType: 'pillars',
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
        title: 'O balancete que qualquer condômino entende.',
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
        tag: 'Aplicativo Semog',
        title: 'O condomínio inteiro na palma da mão.',
        text: 'Boletos, reservas, assembleias e avisos em uma interface que o morador realmente usa.',
        href: '/solucoes#aplicativo',
      },
      {
        image: cOneId,
        theme: 'on-white',
        tag: 'Semog One',
        title: 'O ERP que construímos para o nosso jeito de administrar.',
        text: 'Equipe de desenvolvimento própria e uma plataforma única que evolui toda semana.',
        href: '/solucoes#tecnologia',
      },
    ],
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
  }

  const layout = [
    heroBlock,
    statsBlock,
    valuesMarqueeBlock,
    wordsSectionBlock,
    pillarsBlock,
    solucoesBentoBlock,
    produtosGridBlock,
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
        'Administradora de condomínios em Recife, João Pessoa, Campina Grande e Belém. 700 condomínios, 70 mil clientes, prestação de contas 100% digital e inadimplência zero com o Semog Garante.',
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
