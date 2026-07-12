import config from '@payload-config'
import { getPayload } from 'payload'
import type {
  CTABandBlock,
  FeatureGridBlock,
  HeroBlock,
  RichTextBlock,
  StatsBlock,
} from '@/payload-types'

/**
 * Seed idempotente da Page `home`, aproximando a estrutura de
 * `_reference/index.html`: Hero (slogan "Preocupe-se apenas em morar"),
 * Stats (números da seção "Semog em números"), FeatureGrid (Pilares) e
 * CTABand (seção "CTA final"), fechando com um parágrafo institucional em
 * RichText (Manifesto). Só texto — sem `video`/`poster`/uploads, já que as
 * chaves S3 ainda não estão configuradas.
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
  items: [
    { value: 35, label: 'Anos de mercado' },
    { value: 700, label: 'Condomínios' },
    { value: 70, suffix: 'mil', label: 'Clientes' },
    { value: 100, label: 'Especialistas' },
  ],
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

  const layout = [heroBlock, statsBlock, featureGridBlock, ctaBandBlock, richTextBlock]

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
