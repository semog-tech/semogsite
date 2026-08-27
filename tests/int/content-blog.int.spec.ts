import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { describe, expect, it } from 'vitest'

// `vitest` roda com cwd na raiz do repo (onde fica `vitest.config.mts`).
const BLOG_DIR = path.resolve(process.cwd(), 'content/blog')

const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'))
const parsed = files.map((file) => {
  const raw = readFileSync(path.join(BLOG_DIR, file), 'utf8')
  const { data, content } = matter(raw)
  return { file, data, content }
})

describe('content/blog — posts convertidos de Lexical para MDX', () => {
  // O `toBe(11)` original guardava a conversão do Payload: os 11 posts que
  // existiam no CMS tinham que chegar todos ao disco. Essa intenção continua
  // valendo como PISO — nenhum dos 11 pode sumir —, mas virou piso e não
  // igualdade em 27/08/2026, quando o primeiro post escrito direto em MDX
  // (`g20-superlogica-next-2026`) fez o 12º. Manter igualdade obrigaria a
  // editar este teste a cada publicação, o que treinaria a equipe a mexer no
  // número sem ler o que ele protege.
  it('mantém ao menos os 11 arquivos .mdx vindos do port', () => {
    expect(files.length).toBeGreaterThanOrEqual(11)
  })

  it('cada post tem frontmatter com title/slug/date/category', () => {
    for (const { file, data } of parsed) {
      expect(data.title, `${file}: title`).toBeTruthy()
      expect(data.slug, `${file}: slug`).toBeTruthy()
      expect(data.date, `${file}: date`).toBeTruthy()
      expect(data.category, `${file}: category`).toBeTruthy()
    }
  })

  it('nenhum post ficou com marcador de revisão pendente', () => {
    for (const { file, content } of parsed) {
      expect(content, file).not.toContain('<!-- REVISAR')
    }
  })

  it('os slugs são únicos', () => {
    const slugs = parsed.map(({ data }) => data.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('o slug do frontmatter bate com o nome do arquivo', () => {
    for (const { file, data } of parsed) {
      expect(data.slug, file).toBe(file.replace(/\.mdx$/, ''))
    }
  })
})
