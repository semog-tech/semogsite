import config from '@payload-config'
import { getPayload } from 'payload'
import { getMediaId } from './lib/media'

/**
 * Seed idempotente de 6 categorias + 7 posts do blog, fiel a
 * `_reference/blog.html`: o destaque "Previsão orçamentária..." (Finanças)
 * + os 6 cards da grade (Inadimplência/Gestão/Convivência/Tecnologia/
 * Finanças/Incorporadoras — `_reference/blog.html:156-224`), cada um com
 * `heroImage` (via `getMediaId`, assets já semeados por `pnpm seed:media`)
 * e `readingTime` (minutos, alimenta o "meta" `Equipe Semog · N min` dos
 * cards). A página `/blog` (hero + destaque + grade + newsletter) é semeada
 * separadamente em `src/seed/pages.ts` (`seedBlogPage`), que depende dos
 * posts/categorias criados aqui — rodar `pnpm seed:posts` antes de
 * `pnpm seed:pages`.
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
  { title: 'Convivência', slug: 'convivencia' },
  { title: 'Tecnologia', slug: 'tecnologia' },
  { title: 'Incorporadoras', slug: 'incorporadoras' },
]

const postsData = [
  {
    title: 'Previsão orçamentária: o guia que todo síndico deveria ler antes da assembleia',
    slug: 'previsao-orcamentaria-guia-sindico',
    excerpt:
      'Como montar um orçamento que passa na assembleia sem cortes cegos e sem sustos no meio do ano. Com planilha de referência da equipe Semog.',
    categorySlug: 'financas',
    heroImageFilename: 'blog-financas.webp',
    readingTime: 12,
    publishedAt: '2026-07-14T09:00:00.000Z',
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
    heroImageFilename: 'garante.webp',
    readingTime: 8,
    publishedAt: '2026-07-11T09:00:00.000Z',
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
    heroImageFilename: 'comercial.webp',
    readingTime: 6,
    publishedAt: '2026-07-08T09:00:00.000Z',
    content: richText([
      'Balancete que chega depois do prazo, boleto com valor errado, telefone que ninguém atende: isoladamente, cada um desses problemas parece um deslize pontual. Juntos e recorrentes, são sintoma de uma administradora sem estrutura.',
      'Os sinais mais comuns são: atraso sistemático na prestação de contas, erros financeiros que se repetem mês a mês, ausência de canal de atendimento direto, falta de indicadores de gestão e nenhuma resposta às pautas trazidas em assembleia.',
      'Quando dois ou mais desses sinais aparecem ao mesmo tempo, o custo de continuar geralmente é maior do que o custo de trocar.',
    ]),
  },
  {
    title: 'Áreas de lazer: como definir regras de uso sem virar guerra em assembleia',
    slug: 'areas-lazer-regras-de-uso',
    excerpt:
      'Reserva, taxa de uso e horário de silêncio: modelos de regra que funcionam em condomínios reais.',
    categorySlug: 'convivencia',
    heroImageFilename: 'blog-lazer.webp',
    readingTime: 7,
    publishedAt: '2026-07-05T09:00:00.000Z',
    content: richText([
      'Salão de festas, churrasqueira e academia são as áreas que mais geram reclamação em grupos de WhatsApp de condomínio — geralmente porque a regra de uso nunca foi escrita com clareza ou porque ninguém a aplica igual para todo mundo.',
      'Reserva com antecedência mínima, taxa de uso proporcional ao desgaste do espaço e horário de silêncio bem definido resolvem a maior parte dos conflitos antes que cheguem à portaria. O regimento interno precisa detalhar cada regra, não apenas citá-la de forma genérica.',
      'A equipe Semog ajuda síndicos a redigir e aprovar esse regimento em assembleia, com modelos já testados em centenas de condomínios — porque regra clara evita mediação de conflito depois.',
    ]),
  },
  {
    title: 'Assembleia virtual tem validade jurídica? O que diz a lei em 2026',
    slug: 'assembleia-virtual-validade-juridica',
    excerpt:
      'Convocação, quórum e votação online: o que precisa constar na convenção e como registrar a ata.',
    categorySlug: 'tecnologia',
    heroImageFilename: 'prestacao-contas.webp',
    readingTime: 9,
    publishedAt: '2026-07-02T09:00:00.000Z',
    content: richText([
      'Assembleias híbridas e totalmente virtuais já são rotina em boa parte dos condomínios administrados pela Semog, mas ainda geram dúvida sobre validade jurídica — principalmente quando o assunto é aprovação de contas ou eleição de síndico.',
      'A convenção do condomínio precisa autorizar expressamente a modalidade virtual, com regras claras de convocação, verificação de quórum e sistema de votação auditável. Sem essa previsão, a ata pode ser questionada judicialmente.',
      'Na Semog, cada assembleia virtual é registrada com trilha de auditoria completa — de quem votou a que horas votou — para que a decisão tomada tenha o mesmo peso legal de uma assembleia presencial.',
    ]),
  },
  {
    title: 'Fundo de reserva: quanto o seu condomínio deveria guardar por mês',
    slug: 'fundo-reserva-quanto-guardar-por-mes',
    excerpt:
      'A conta que evita rateio extra: percentuais praticados, o que a convenção pode exigir e quando usar.',
    categorySlug: 'financas',
    heroImageFilename: 'residencial.webp',
    readingTime: 5,
    publishedAt: '2026-06-28T09:00:00.000Z',
    content: richText([
      'Fundo de reserva baixo é a razão mais comum de rateio extra: quando um elevador quebra ou o telhado precisa de reparo, o condomínio sem reserva suficiente cobra a diferença de uma vez só dos moradores.',
      'A prática de mercado varia entre 5% e 10% da receita mensal, mas a convenção de cada condomínio pode — e deveria — fixar um percentual mínimo, e a assembleia pode aprovar aportes extraordinários em anos de obra planejada.',
      'A equipe Semog projeta, junto com o síndico, quanto reservar mês a mês com base no histórico de manutenção do prédio — para que o fundo cubra o previsível sem pesar demais no orçamento corrente.',
    ]),
  },
  {
    title: 'Assembleia de instalação: o checklist completo para condomínios novos',
    slug: 'assembleia-instalacao-checklist-condominios-novos',
    excerpt:
      'Da convocação dos compradores ao CNPJ do condomínio, tudo que precisa acontecer na ordem certa.',
    categorySlug: 'incorporadoras',
    heroImageFilename: 'incorporadoras.webp',
    readingTime: 10,
    publishedAt: '2026-06-22T09:00:00.000Z',
    content: richText([
      'A assembleia de instalação é o primeiro ato jurídico do condomínio: sem ela, não existe CNPJ, não existe síndico eleito e não existe conta bancária em nome do condomínio.',
      'O checklist começa na convocação formal de todos os compradores, passa pela leitura e aprovação da convenção e do regimento interno, e termina na eleição do síndico e do conselho fiscal — tudo registrado em ata específica para abertura de CNPJ.',
      'A Semog conduz esse processo desde a convocação até o registro em cartório, para que a incorporadora entregue as chaves com o condomínio juridicamente pronto para funcionar.',
    ]),
  },
]

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
    const { categorySlug, heroImageFilename, ...rest } = post
    const heroImageId = await getMediaId(payload, heroImageFilename)
    const data = {
      ...rest,
      category: categoryIdBySlug.get(categorySlug),
      heroImage: heroImageId,
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
}

await seedPosts()
