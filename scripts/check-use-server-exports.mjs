import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Portão: em módulo `'use server'`, nada de exportar TIPO.
 *
 * A faixa é estreita de propósito, e é a única em que este script é
 * insubstituível. O compilador do Next já recusa sozinho o que sobra — medido
 * com o compilador real, appendando cada forma a um módulo `'use server'`:
 *
 *   export const enviar = async (a) => a          → o Next ACEITA (vira action)
 *   export const enviar2 = async function (a) {}  → o Next ACEITA (vira action)
 *   export const LIMITE = 5                       → o Next RECUSA no build
 *   export type Extra = { a: string }             → o Next NÃO VÊ, e passa
 *
 * As duas primeiras linhas explicam por que este script não tenta decidir "é
 * função async?": as formas de arrow e function expression são actions de
 * primeira classe, com id próprio no chunk, e uma regra que olhasse a forma da
 * função acabaria recusando código que o framework aceita. A terceira mostra
 * que barrar constante seria redundância — o build já quebra. A quarta é o
 * buraco: o TypeScript apaga o tipo ANTES de o compilador enxergar, então nada
 * na cadeia reclama.
 *
 * E foi exatamente esse buraco que custou caro: em agosto/2026 um
 * `export type { FormType }` em `src/app/(frontend)/_actions/submit-form.ts`
 * derrubou os três formulários do site por 12 dias. O `next build`, o
 * `tsc --noEmit` e os 200 testes do Vitest passaram o tempo todo — o export do
 * tipo virava entrada do registro de Server Actions, o tipo sumia na
 * compilação, e o módulo morria com `ReferenceError` na primeira submissão. O
 * Vitest não pega porque importa o módulo TypeScript direto, sem passar pela
 * transformação que gera o registro.
 *
 * Ou seja: este passo não é redundante com o build. Ele cobre o único caso que
 * o build deixa passar em silêncio.
 *
 * Roda no CI junto dos outros portões (`pnpm check:server-actions`).
 */

const RAIZ = 'src'
const EXTENSOES = ['.ts', '.tsx']

/** Caminha a árvore devolvendo só os arquivos de código. */
function listarArquivos(dir) {
  const saida = []
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const caminho = join(dir, item.name)
    if (item.isDirectory()) {
      saida.push(...listarArquivos(caminho))
    } else if (EXTENSOES.some((ext) => item.name.endsWith(ext))) {
      saida.push(caminho)
    }
  }
  return saida
}

/**
 * `true` só quando `'use server'` é a diretiva do **módulo** — a primeira coisa
 * do arquivo, ignorados comentários e espaços. A distinção não é preciosismo: o
 * `'use server'` dentro de uma função async é uma action inline, padrão
 * legítimo e comum, que este portão não pode acusar. Procurar a string solta no
 * arquivo daria falso positivo em todo componente que use esse formato.
 */
function ehModuloUseServer(texto) {
  let i = texto.charCodeAt(0) === 0xfeff ? 1 : 0
  for (;;) {
    while (i < texto.length && /\s/.test(texto[i])) i++
    if (texto.startsWith('//', i)) {
      const fim = texto.indexOf('\n', i)
      i = fim === -1 ? texto.length : fim + 1
      continue
    }
    if (texto.startsWith('/*', i)) {
      const fim = texto.indexOf('*/', i)
      i = fim === -1 ? texto.length : fim + 2
      continue
    }
    break
  }
  return texto.startsWith("'use server'", i) || texto.startsWith('"use server"', i)
}

/**
 * Exports de tipo no topo do módulo — declaração (`export type X =`,
 * `export interface X`) e reexport (`export type { X }`, `export type * from`).
 *
 * `[^\n]*` em vez de `.*$` de propósito: no Windows o arquivo em disco termina
 * cada linha em `\r\n`, o `.` não casa `\r` e o `$` sem flag `m` nunca casa
 * antes dele — a versão com `.*$` deixaria o `\r` dentro da captura e falharia
 * em silêncio aqui, passando verde no CI (Linux, LF). O `\r` que sobra na
 * captura é removido na hora de exibir.
 */
const RE_EXPORT_DE_TIPO = /^export\s+(?:type\b|interface\b)[^\n]*/gm

const arquivos = listarArquivos(RAIZ)
const violacoes = []

for (const arquivo of arquivos) {
  const texto = readFileSync(arquivo, 'utf8')
  if (!ehModuloUseServer(texto)) continue

  for (const achado of texto.matchAll(RE_EXPORT_DE_TIPO)) {
    violacoes.push({
      arquivo,
      numero: texto.slice(0, achado.index).split('\n').length,
      linha: achado[0].replace(/\r$/, '').trim(),
    })
  }
}

if (violacoes.length === 0) {
  console.log(`OK — nenhum export de tipo em módulo 'use server' (${arquivos.length} arquivos).`)
  process.exit(0)
}

for (const v of violacoes) {
  console.error(`\n✖ ${v.arquivo}:${v.numero}`)
  console.error(`    ${v.linha}`)
}

console.error(`
Módulo 'use server' não pode exportar tipo. O Next registra todo export como
Server Action, mas o TypeScript apaga o tipo antes da compilação: o registro
fica apontando para um identificador que não existe e o módulo inteiro morre com
"ReferenceError: X is not defined" na primeira chamada — depois de o build, o
tsc e os testes terem passado, porque nenhum deles enxerga este caso.

Como corrigir: mova o tipo para um módulo comum e importe de lá. Os tipos dos
formulários moram em src/lib/forms.ts.
`)
process.exit(1)
