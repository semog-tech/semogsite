/**
 * Lê uma página legal (`privacidade`/`termos`) de `content/legal/*.mdx`
 * (frontmatter + corpo) — Task 3 da migração do blog: substitui o builder
 * de lexical (`legalRichText`, removido) por uma leitura direta do MDX
 * (mesmo padrão de `src/lib/blog.ts`, gray-matter, sem banco). Vive em
 * `content/lib` (não `src/lib`) porque só `content/pages/privacidade.ts`/
 * `termos.ts` consomem isto — dado de página estática, não a camada de
 * posts do blog.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

export interface LegalPage {
  title: string
  updatedText: string
  body: string
}

const LEGAL_DIR = path.resolve(process.cwd(), 'content/legal')

export function getLegalPage(slug: 'privacidade' | 'termos'): LegalPage {
  const raw = readFileSync(path.join(LEGAL_DIR, `${slug}.mdx`), 'utf8')
  const { data, content } = matter(raw)
  return {
    title: String(data.title),
    updatedText: String(data.updatedText),
    body: content.trim(),
  }
}
