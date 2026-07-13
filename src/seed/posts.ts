import config from '@payload-config'
import { getPayload } from 'payload'
import type { BlogListBlock, HeroBlock } from '@/payload-types'

/**
 * Seed idempotente de 3 categorias + 3 posts do blog, com títulos/excerpts
 * fiéis a `_reference/blog.html` (destaque "Previsão orçamentária..." +
 * dois cards do grid: "Inadimplência..." e "Cinco sinais..."). Também semeia
 * a `page` slug `blog` (Hero, fiel ao `<h1>` de `_reference/blog.html:149`,
 * + bloco `blogList`) para que a rota catch-all `[[...slug]]` sirva `/blog`
 * como a listagem. Sem `heroImage` — S3 ainda não configurado (Task
 * futura).
 *
 * Executa via `pnpm seed:posts` (`payload run src/seed/posts.ts`): assim
 * como `src/seed/home.ts`, obtém a própria instância do Payload — o CLI
 * `payload run` não injeta uma pronta.
 */

// biome-ignore lint/suspicious/noExplicitAny: shape mínimo de parágrafo lexical, não vale tipar o AST inteiro aqui
function richText(paragraphs: string[]): any {
  return {
    root: {
      type: 'root',
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
        children: [
          {
            type: 'text',
            format: 0,
            detail: 0,
            mode: 'normal' as const,
            style: '',
            text,
            version: 1,
          },
        ],
      })),
    },
  }
}

const categoriesData = [
  { title: 'Finanças', slug: 'financas' },
  { title: 'Inadimplência', slug: 'inadimplencia' },
  { title: 'Gestão', slug: 'gestao' },
]

const postsData = [
  {
    title: 'Previsão orçamentária: o guia que todo síndico deveria ler antes da assembleia',
    slug: 'previsao-orcamentaria-guia-sindico',
    excerpt:
      'Como montar um orçamento que passa na assembleia sem cortes cegos e sem sustos no meio do ano. Com planilha de referência da equipe Semog.',
    categorySlug: 'financas',
    publishedAt: '2026-07-10T09:00:00.000Z',
    content: richText([
      'Um orçamento bem construído não é uma peça de burocracia para "cumprir tabela" na assembleia: é o que garante que manutenção, obras e reservas não virem rateio extra no meio do ano.',
      'Antes de levar a proposta aos condôminos, a equipe Semog reúne o histórico de despesas dos últimos 12 meses, projeta reajustes contratuais e separa o que é gasto recorrente do que é investimento pontual — para que cada linha do orçamento tenha uma explicação clara e defensável.',
      'Com esse material em mãos, a assembleia deixa de ser um embate sobre números soltos e passa a ser uma decisão informada sobre prioridades.',
    ]),
  },
  {
    title: 'Inadimplência no condomínio: o que a lei permite e o que resolve de verdade',
    slug: 'inadimplencia-condominio-o-que-a-lei-permite',
    excerpt:
      'Dos juros permitidos à negativação, um mapa honesto das opções e por que a prevenção vence a cobrança.',
    categorySlug: 'inadimplencia',
    publishedAt: '2026-07-03T09:00:00.000Z',
    content: richText([
      'A lei permite multa de até 2%, juros de mora e, em casos de reincidência, uma cota extraordinária mais alta para o condômino inadimplente — mas nenhuma dessas ferramentas substitui uma régua de cobrança bem desenhada.',
      'Negativação e ação judicial resolvem casos extremos, porém chegam tarde: o efeito mais forte contra a inadimplência acontece nos primeiros dias de atraso, com contato direto, opções de negociação e transparência sobre o impacto no caixa comum.',
      'É por isso que a Semog trata cobrança como processo contínuo, não como reação pontual — evitando que o vizinho inadimplente vire uma questão de assembleia.',
    ]),
  },
  {
    title: 'Cinco sinais de que é hora de trocar de administradora',
    slug: 'cinco-sinais-trocar-administradora',
    excerpt:
      'Balancete atrasado, boleto errado, telefone que não atende. Saiba quando o problema não é pontual, é estrutural.',
    categorySlug: 'gestao',
    publishedAt: '2026-06-20T09:00:00.000Z',
    content: richText([
      'Balancete que chega depois do prazo, boleto com valor errado, telefone que ninguém atende: isoladamente, cada um desses problemas parece um deslize pontual. Juntos e recorrentes, são sintoma de uma administradora sem estrutura.',
      'Os sinais mais comuns são: atraso sistemático na prestação de contas, erros financeiros que se repetem mês a mês, ausência de canal de atendimento direto, falta de indicadores de gestão e nenhuma resposta às pautas trazidas em assembleia.',
      'Quando dois ou mais desses sinais aparecem ao mesmo tempo, o custo de continuar geralmente é maior do que o custo de trocar.',
    ]),
  },
]

const blogHeroBlock: Omit<HeroBlock, 'id' | 'blockName'> = {
  blockType: 'hero',
  eyebrow: 'Blog Semog',
  headline: 'Quem administra 700 condomínios tem muito a ensinar.',
  subhead:
    'Conteúdo prático para síndicos, conselheiros e moradores: finanças do condomínio, assembleias, inadimplência e convivência.',
}

async function seedPosts() {
  const payload = await getPayload({ config })

  const categoryIdBySlug = new Map<string, number>()
  for (const category of categoriesData) {
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: category.slug } },
      limit: 1,
      depth: 0,
    })

    if (existing.docs[0]) {
      const updated = await payload.update({
        collection: 'categories',
        id: existing.docs[0].id,
        data: category,
      })
      categoryIdBySlug.set(category.slug, updated.id)
      console.log(`[seed:posts] Categoria "${category.title}" atualizada (id=${updated.id}).`)
    } else {
      const created = await payload.create({
        collection: 'categories',
        data: category,
      })
      categoryIdBySlug.set(category.slug, created.id)
      console.log(`[seed:posts] Categoria "${category.title}" criada (id=${created.id}).`)
    }
  }

  for (const post of postsData) {
    const { categorySlug, ...rest } = post
    const data = {
      ...rest,
      category: categoryIdBySlug.get(categorySlug),
      _status: 'published' as const,
    }

    const existing = await payload.find({
      collection: 'posts',
      where: { slug: { equals: post.slug } },
      limit: 1,
      depth: 0,
    })

    if (existing.docs[0]) {
      const updated = await payload.update({
        collection: 'posts',
        id: existing.docs[0].id,
        data,
      })
      console.log(`[seed:posts] Post "${post.title}" atualizado (id=${updated.id}).`)
    } else {
      const created = await payload.create({
        collection: 'posts',
        data,
      })
      console.log(`[seed:posts] Post "${post.title}" criado (id=${created.id}).`)
    }
  }

  const blogListBlock: Omit<BlogListBlock, 'id' | 'blockName'> = {
    blockType: 'blogList',
    title: 'Últimos posts',
    limit: 6,
  }

  const layout = [blogHeroBlock, blogListBlock]
  const pageData = {
    title: 'Blog',
    slug: 'blog',
    _status: 'published' as const,
    layout,
  }

  const existingPage = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'blog' } },
    limit: 1,
    depth: 0,
  })

  if (existingPage.docs[0]) {
    const updated = await payload.update({
      collection: 'pages',
      id: existingPage.docs[0].id,
      data: pageData,
    })
    console.log(`[seed:posts] Página "blog" atualizada (id=${updated.id}).`)
  } else {
    const created = await payload.create({
      collection: 'pages',
      data: pageData,
    })
    console.log(`[seed:posts] Página "blog" criada (id=${created.id}).`)
  }
}

await seedPosts()
