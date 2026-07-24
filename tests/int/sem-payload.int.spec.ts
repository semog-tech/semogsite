import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Lock test da Fase 4 (Task 1 — "arrancar o Payload"): garante que nada fora
 * do escopo do próprio Payload ainda IMPORTA Payload. Prova que a remoção
 * feita nas próximas tasks (apagar o pacote, `(payload)`, collections,
 * globals, configs) é segura — se este teste passa agora, remover aquele
 * material depois não deixa nenhum import quebrado pra trás.
 *
 * `vitest` roda com cwd na raiz do repo (`vitest.config.mts`), igual aos
 * outros testes de conteúdo (`content-blog.int.spec.ts`).
 */
const ROOT = process.cwd()

// Árvores varridas — onde vive código de aplicação/conteúdo. Config de
// ferramentas na raiz do repo (`next.config.ts`, que ainda envolve
// `withPayload`) fica fora de propósito: é fiação de integração do próprio
// Payload, não um "straggler" de app — some junto do Payload nas Tasks 2-4.
const SCAN_DIRS = ['src', 'content', 'tests']

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.cjs', '.cts'])

/**
 * Diretórios que SÃO o Payload — collections, globals, migrations, os
 * scripts de seed (rodados via `payload run`) e o próprio route group
 * `(payload)` (admin + API REST/GraphQL). Todos previstos para desaparecer
 * nas Tasks 2-4 desta mesma fase; a instrução desta task é explícita em NÃO
 * apagá-los ainda. Excluí-los do lock test não esconde nenhum straggler: eles
 * são o alvo da própria remoção, não algo que devesse ter sido migrado agora.
 */
const EXCLUDED_DIR_PREFIXES = [
  'src/app/(payload)/',
  'src/collections/',
  'src/globals/',
  'src/migrations/',
  'src/seed/',
]

/**
 * Arquivos individuais que são o próprio Payload por outros motivos:
 * - `payload.config.ts`: config raiz do Payload (collections/globals/plugins).
 * - `payload-types.ts`: gerado por `payload generate:types` — mantido nesta
 *   fase (CRLF preservado de propósito, ver nota da task).
 * - `lib/payload.ts`: o client Payload em si — a FONTE de onde os 5
 *   stragglers desta task migraram (`getPageBySlug`/`getSiteSettings`/etc.);
 *   depois da migração, nada mais importa dele (órfão), mas ele continua
 *   existindo até a remoção de fato.
 */
const EXCLUDED_FILES = new Set([
  'src/payload.config.ts',
  'src/payload-types.ts',
  'src/lib/payload.ts',
  // Este próprio arquivo — não faz sentido o lock test se autoexaminar.
  'tests/int/sem-payload.int.spec.ts',
])

// `src/blocks/<Nome>/config.ts` é a definição de campos do bloco pro admin do
// Payload (`import type { Block } from 'payload'`) — distinto do
// `Component.tsx` do mesmo bloco, que É o renderer de produção e não deveria
// (e não importa) nada do Payload. Some junto do resto do CMS.
const BLOCK_CONFIG_RE = /^src\/blocks\/[^/]+\/config\.ts$/

function isExcluded(relPath: string): boolean {
  if (EXCLUDED_FILES.has(relPath)) return true
  if (EXCLUDED_DIR_PREFIXES.some((prefix) => relPath.startsWith(prefix))) return true
  if (BLOCK_CONFIG_RE.test(relPath)) return true
  return false
}

function walk(dir: string, out: string[]): void {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === '.next') continue
    const full = path.join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      walk(full, out)
    } else if (EXTENSIONS.has(path.extname(entry))) {
      out.push(full)
    }
  }
}

/**
 * Remove comentários (linha `//` e bloco `/* *\/`) de cada linha, mantendo só
 * o código de verdade — assim uma menção a "payload" em comentário/doc (ex.:
 * `src/types/blocks.ts`, que cita `src/payload-types.ts` só como referência)
 * nunca é lida como import de verdade. Não é um parser completo de JS (não
 * entende strings/regex com `//`/`/*` dentro), mas é suficiente pro código
 * real deste repo — o alvo aqui são linhas de `import`/`require`, que nunca
 * carregam esse tipo de string.
 */
function codeLines(source: string): string[] {
  const lines = source.split(/\r?\n/)
  const result: string[] = []
  let inBlock = false
  for (const line of lines) {
    let code = ''
    let i = 0
    while (i < line.length) {
      if (inBlock) {
        const end = line.indexOf('*/', i)
        if (end === -1) {
          i = line.length
          break
        }
        inBlock = false
        i = end + 2
        continue
      }
      const lineIdx = line.indexOf('//', i)
      const blockIdx = line.indexOf('/*', i)
      if (blockIdx !== -1 && (lineIdx === -1 || blockIdx < lineIdx)) {
        code += line.slice(i, blockIdx)
        inBlock = true
        i = blockIdx + 2
        continue
      }
      if (lineIdx !== -1) {
        code += line.slice(i, lineIdx)
        break
      }
      code += line.slice(i)
      break
    }
    result.push(code)
  }
  return result
}

/** Fontes de import que caracterizam uma dependência de Payload. */
function isPayloadSpecifier(spec: string): boolean {
  return (
    spec === 'payload' ||
    spec.startsWith('@payloadcms/') ||
    spec === '@/payload-types' ||
    spec === '@/lib/payload' ||
    spec === '@payload-config'
  )
}

// Casa a string importada logo depois de `from`/`require(`/`import(`/`import `
// — ou seja, só onde ela é de fato a fonte de um import/require, nunca um
// texto solto de comentário (já removido por `codeLines` antes disso).
const IMPORT_SOURCE_RE = /(?:from|require|import)\s*\(?\s*['"]([^'"]+)['"]/g

interface Violation {
  file: string
  line: number
  text: string
}

function findViolations(): Violation[] {
  const violations: Violation[] = []
  for (const dirName of SCAN_DIRS) {
    const files: string[] = []
    walk(path.join(ROOT, dirName), files)
    for (const full of files) {
      const rel = path.relative(ROOT, full).split(path.sep).join('/')
      if (isExcluded(rel)) continue
      const source = readFileSync(full, 'utf8')
      const lines = codeLines(source)
      lines.forEach((line, idx) => {
        IMPORT_SOURCE_RE.lastIndex = 0
        let match: RegExpExecArray | null
        // biome-ignore lint/suspicious/noAssignInExpressions: idiomático pra iterar matches de regex global
        while ((match = IMPORT_SOURCE_RE.exec(line))) {
          if (isPayloadSpecifier(match[1])) {
            violations.push({ file: rel, line: idx + 1, text: line.trim() })
          }
        }
      })
    }
  }
  return violations
}

describe('sem-payload — lock test (Fase 4, Task 1)', () => {
  it('nenhum import de Payload fora do próprio Payload (collections/globals/migrations/seed/(payload)/blocks-config/lib-payload)', () => {
    const violations = findViolations()
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([])
  })
})
