import config from '@payload-config'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'

/**
 * Conversão única (one-off): lê os 11 posts publicados + as 2 páginas legais
 * (`privacidade`/`termos`) via Payload Local API — a mesma base de produção,
 * acessada pelo dev server via proxy — e serializa o `richText` (Lexical) de
 * cada um para Markdown/MDX com frontmatter.
 *
 * Roda uma vez (`pnpm exec cross-env NODE_OPTIONS=--no-deprecation payload run
 * scripts/lexical-to-mdx.mjs`) pra gerar `content/blog/*.mdx` e
 * `content/legal/*.mdx`. Depois disso os `.mdx` viram a fonte da verdade (Task
 * 3 lê-los direto, sem Payload) — não há por que rodar de novo, a menos que
 * se decida reimportar do banco.
 *
 * Nós lexical cobertos (levantados com um dump de todos os 11 posts + as 2
 * páginas legais antes de escrever este arquivo — ver
 * `.superpowers/sdd/redesign/cms02-task-2-report.md`): `root`, `paragraph`,
 * `heading` (h2/h3), `list`/`listitem` (bullet/number), `quote`, `text`
 * (negrito/itálico/tachado/sublinhado via bitmask de `format`), `link`
 * (`fields.url` interno ou `mailto:`) e `linebreak`. Qualquer outro tipo de
 * nó (ex.: `upload`/imagem embutida, tabela) não ocorre nos dados reais, mas
 * se aparecer, o serializador não adivinha: emite um marcador
 * `<!-- REVISAR -->` e registra o caso no console.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const BLOG_DIR = path.join(ROOT, 'content', 'blog')
const LEGAL_DIR = path.join(ROOT, 'content', 'legal')

// ---------------------------------------------------------------------------
// Bitmask de formatação de texto do Lexical (`TextNode.__format`).
// https://github.com/facebook/lexical — mesmos valores usados pelo editor
// padrão do `@payloadcms/richtext-lexical` (bold/italic são os únicos que os
// posts/legais realmente usam; os demais ficam aqui por robustez).
// ---------------------------------------------------------------------------
const FORMAT_BOLD = 1
const FORMAT_ITALIC = 2
const FORMAT_STRIKETHROUGH = 4
const FORMAT_UNDERLINE = 8
const FORMAT_CODE = 16

/** Escapa caracteres que o Markdown/MDX interpretaria como sintaxe (nenhum ocorre nos dados reais hoje — defensivo). */
function escapeMdText(text) {
  return text.replace(/([\\*_[\]`])/g, '\\$1')
}

/** Registro de nós que o serializador não sabe converter — vira `<!-- REVISAR -->` no MDX e entra no relatório. */
function reportUnsupported(concerns, context, node) {
  const marker = `<!-- REVISAR: nó lexical "${node?.type}" não suportado, ver ${context} -->`
  concerns.push(`${context}: nó "${node?.type}" não suportado — ${JSON.stringify(node).slice(0, 200)}`)
  console.warn(`[lexical-to-mdx] ${marker}`)
  return marker
}

/**
 * Serializa um nó de texto simples, aplicando negrito/itálico/tachado/sublinhado/code
 * pelo bitmask `format`. Os posts reais têm nós em negrito com espaço à direita colado
 * no texto (ex.: `{ text: 'Porte do condomínio: ', bold: true }`) — se os marcadores
 * `**`/`*` envolvessem esse espaço, o CommonMark não fecharia a ênfase (regra de
 * "right-flanking delimiter run": o caractere antes do fechamento não pode ser espaço)
 * e o marcador apareceria literal na página. Por isso separamos espaços nas pontas do
 * texto ANTES de aplicar os marcadores, e os devolvemos por fora deles.
 */
function serializeTextNode(node) {
  if (node.format & FORMAT_CODE) {
    return `\`${node.text.replaceAll('`', '\\`')}\``
  }
  const [, leading, core, trailing] = node.text.match(/^(\s*)([\s\S]*?)(\s*)$/)
  if (core === '') return node.text // só espaço (ou vazio) — nada para marcar

  let out = escapeMdText(core)
  if (node.format & FORMAT_BOLD) out = `**${out}**`
  if (node.format & FORMAT_ITALIC) out = `*${out}*`
  if (node.format & FORMAT_STRIKETHROUGH) out = `~~${out}~~`
  if (node.format & FORMAT_UNDERLINE) out = `<u>${out}</u>`
  return leading + out + trailing
}

/** Serializa uma sequência de nós inline (texto, link, quebra de linha) — usado por parágrafo, heading, quote e item de lista. */
function serializeInline(nodes, concerns, context) {
  return (nodes ?? [])
    .map((node) => {
      switch (node.type) {
        case 'text':
          return serializeTextNode(node)
        case 'linebreak':
          return '  \n'
        case 'link': {
          const url = node.fields?.url ?? ''
          const text = serializeInline(node.children, concerns, context)
          return `[${text}](${url})`
        }
        default:
          return reportUnsupported(concerns, context, node)
      }
    })
    .join('')
}

/** Serializa um nó de lista (bullet/number), recursivo pra listas aninhadas (não ocorre nos dados reais, mas fica coberto). */
function serializeList(node, concerns, context, depth = 0) {
  const indent = '  '.repeat(depth)
  return node.children
    .map((item, i) => {
      const marker = node.listType === 'number' ? `${item.value ?? i + 1}.` : '-'
      const inlineChildren = (item.children ?? []).filter((c) => c.type !== 'list')
      const nestedLists = (item.children ?? []).filter((c) => c.type === 'list')
      const line = `${indent}${marker} ${serializeInline(inlineChildren, concerns, context)}`
      const nested = nestedLists
        .map((nestedList) => serializeList(nestedList, concerns, context, depth + 1))
        .join('\n')
      return nested ? `${line}\n${nested}` : line
    })
    .join('\n')
}

/** Serializa um nó de bloco (parágrafo, heading, lista, quote) para uma string Markdown de bloco. */
function serializeBlock(node, concerns, context) {
  switch (node.type) {
    case 'paragraph':
      return serializeInline(node.children, concerns, context)
    case 'heading': {
      const level = node.tag === 'h3' ? '###' : node.tag === 'h4' ? '####' : '##'
      return `${level} ${serializeInline(node.children, concerns, context)}`
    }
    case 'quote':
      return `> ${serializeInline(node.children, concerns, context)}`
    case 'list':
      return serializeList(node, concerns, context)
    default:
      return reportUnsupported(concerns, context, node)
  }
}

/** Serializa `content.root` (Lexical) inteiro para Markdown, um bloco por parágrafo em branco. */
function serializeRichText(richText, concerns, context) {
  const children = richText?.root?.children ?? []
  return children.map((node) => serializeBlock(node, concerns, context)).join('\n\n')
}

// ---------------------------------------------------------------------------
// Frontmatter YAML — sempre string entre aspas duplas (escapando `\` e `"`)
// pra não depender de heurística de scalar "plain" do YAML (títulos com `:`
// e excertos com aspas internas ocorrem nos dados reais).
// ---------------------------------------------------------------------------
function yamlString(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function buildFrontmatter(fields) {
  const lines = ['---']
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined) {
      lines.push(`${key}: null`)
    } else {
      lines.push(`${key}: ${yamlString(value)}`)
    }
  }
  lines.push('---')
  return lines.join('\n')
}

async function convertPosts(payload, concerns) {
  mkdirSync(BLOG_DIR, { recursive: true })

  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    depth: 1,
    limit: 100,
    sort: '-publishedAt',
  })

  const slugs = new Set()
  for (const post of posts) {
    if (slugs.has(post.slug)) {
      throw new Error(`[lexical-to-mdx] slug duplicado entre posts: "${post.slug}"`)
    }
    slugs.add(post.slug)

    const categorySlug = typeof post.category === 'object' ? (post.category?.slug ?? null) : null
    const heroImageUrl = typeof post.heroImage === 'object' ? (post.heroImage?.url ?? null) : null
    const body = serializeRichText(post.content, concerns, `post "${post.slug}"`)

    const frontmatter = buildFrontmatter({
      title: post.title,
      slug: post.slug,
      date: post.publishedAt,
      category: categorySlug,
      excerpt: post.excerpt,
      heroImage: heroImageUrl,
    })

    writeFileSync(path.join(BLOG_DIR, `${post.slug}.mdx`), `${frontmatter}\n\n${body}\n`, 'utf8')
    console.log(`[lexical-to-mdx] post convertido: ${post.slug}.mdx`)
  }

  return posts.length
}

async function convertLegalPage(payload, slug, concerns) {
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
  })
  const page = docs[0]
  if (!page) throw new Error(`[lexical-to-mdx] página legal "${slug}" não encontrada`)

  const richTextBlock = page.layout.find((block) => block.blockType === 'richText')
  const legalHeroBlock = page.layout.find((block) => block.blockType === 'legalHero')
  if (!richTextBlock) throw new Error(`[lexical-to-mdx] página "${slug}" sem bloco richText`)

  const body = serializeRichText(richTextBlock.content, concerns, `página legal "${slug}"`)
  const frontmatter = buildFrontmatter({
    title: page.title,
    slug: page.slug,
    updatedText: legalHeroBlock?.updatedText ?? null,
  })

  mkdirSync(LEGAL_DIR, { recursive: true })
  writeFileSync(path.join(LEGAL_DIR, `${slug}.mdx`), `${frontmatter}\n\n${body}\n`, 'utf8')
  console.log(`[lexical-to-mdx] página legal convertida: ${slug}.mdx`)
}

async function run() {
  const payload = await getPayload({ config })
  const concerns = []

  const postCount = await convertPosts(payload, concerns)
  await convertLegalPage(payload, 'privacidade', concerns)
  await convertLegalPage(payload, 'termos', concerns)

  console.log(`\n[lexical-to-mdx] concluído: ${postCount} posts + 2 páginas legais.`)
  if (concerns.length > 0) {
    console.warn(`\n[lexical-to-mdx] ${concerns.length} ponto(s) para revisão manual:`)
    for (const c of concerns) console.warn(` - ${c}`)
  } else {
    console.log('[lexical-to-mdx] nenhum nó lexical não suportado encontrado.')
  }

  process.exit(0)
}

await run()
