import config from '@payload-config'
import { getPayload } from 'payload'
import type {
  CitiesBlock,
  CTABandBlock,
  FeatureGridBlock,
  GaranteBlock,
  HeroBlock,
  RichTextBlock,
  StatsBlock,
} from '@/payload-types'

/**
 * Seed idempotente da Page `home`, em fidelidade total à ordem de seções de
 * `_reference/index.html`: Hero (slogan "Preocupe-se apenas em morar"),
 * Stats (número da seção "Semog em números", com eyebrow/título e prefixo
 * "+" nos itens 700/70mil/100 — `_reference/index.html:519-536`), Semog
 * Garante (banda `.g-band-home` + os 4 passos "Como funciona" de
 * `garante.html`), FeatureGrid (Pilares), Cities (seção "Presença",
 * `.cities-acc`), CTABand (seção "CTA final") e um parágrafo institucional
 * em RichText (Manifesto) fechando a página. Só texto — sem
 * `video`/`poster`/uploads, já que as chaves S3 ainda não estão
 * configuradas.
 *
 * Executa via `pnpm seed` (`payload run src/seed/home.ts`): o próprio
 * script obtém a instância do Payload com `getPayload({ config })`, o CLI
 * `payload run` não injeta uma pronta.
 */

const heroBlock: Omit<HeroBlock, 'id' | 'blockName'> = {
  blockType: 'hero',
  eyebrow: 'Condomínios. Métricas. Organização.',
  headline: 'Preocupe-se apenas em morar.',
  subhead: 'Há 35 anos, a líder do Nordeste cuida do condomínio para você cuidar da vida.',
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
  ],
}

const garanteBlock: Omit<GaranteBlock, 'id' | 'blockName'> = {
  blockType: 'garante',
  eyebrow: 'Semog Garante',
  title: 'A receita do condomínio, blindada.',
  text: 'Garantia de 100% da arrecadação do condomínio, todos os meses, por 1% da arrecadação. Parceria Semog + G5 Partners.',
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
  cta: { label: 'Conhecer o Semog Garante', href: '/garante' },
  note: '1% da arrecadação. Sem adesão, sem letra miúda.',
}

const featureGridBlock: Omit<FeatureGridBlock, 'id' | 'blockName'> = {
  blockType: 'featureGrid',
  features: [
    {
      title: 'Condomínios',
      description:
        'Gestão completa de comunidades residenciais, comerciais e associações, do financeiro à assembleia.',
    },
    {
      title: 'Métricas',
      description:
        'Decisões guiadas por dados: indicadores, gráficos e relatórios que todo condômino entende.',
    },
    {
      title: 'Organização',
      description:
        'Processos claros, prazos cumpridos e documentação impecável, sempre ao seu alcance.',
    },
  ],
}

const citiesBlock: Omit<CitiesBlock, 'id' | 'blockName'> = {
  blockType: 'cities',
  eyebrow: 'Presença',
  title: 'Do Nordeste ao Norte, perto de você.',
  items: [
    { city: 'Recife', uf: 'PE', role: 'Matriz' },
    { city: 'João Pessoa', uf: 'PB', role: 'Filial' },
    { city: 'Campina Grande', uf: 'PB', role: 'Filial' },
    { city: 'Belém', uf: 'PA', role: 'Filial' },
  ],
}

const ctaBandBlock: Omit<CTABandBlock, 'id' | 'blockName'> = {
  blockType: 'ctaBand',
  title: 'Seu condomínio merece governança de líder.',
  text: 'Receba uma proposta sob medida em até 24 horas úteis.',
  cta: { label: 'Solicitar proposta', href: '/proposta' },
}

const richTextBlock: Omit<RichTextBlock, 'id' | 'blockName'> = {
  blockType: 'richText',
  content: {
    root: {
      type: 'root',
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'text',
              format: 0,
              detail: 0,
              mode: 'normal',
              style: '',
              text: 'Condomínio bem administrado é aquele que ninguém percebe. Percebe-se a vida que acontece dentro dele. Nós cuidamos de todo o resto.',
              version: 1,
            },
          ],
        },
      ],
    },
  },
}

async function seedHome() {
  const payload = await getPayload({ config })

  const layout = [
    heroBlock,
    statsBlock,
    garanteBlock,
    featureGridBlock,
    citiesBlock,
    ctaBandBlock,
    richTextBlock,
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
