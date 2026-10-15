import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

/**
 * Guardas de identidade do site v2. As regras de CSS são as que o `build.mjs` do protótipo
 * barrava (PROIBIDOS), mais duas desta fase: fonte só pelo next/font e nada de reduced-motion
 * (decisão do Leandro: animar para todos). Rodam no Vitest para continuarem travadas na CI.
 *
 * Todo texto lido do disco passa por `normalizar`: no Windows o checkout tem CRLF e na CI, LF.
 */
export type Violacao = { arquivo: string; linha: number; motivo: string }
type Regra = readonly [padrao: RegExp, motivo: string]

const REGRAS_CSS: readonly Regra[] = [
  [/#[0-9a-fA-F]{3,8}\b/, 'cor em hex fora do :root (use token)'],
  [
    /border-radius\s*:(?!\s*(?:0|var\(--raio\))\s*(?:;|$))/,
    'border-radius diferente de 0 (ponta reta)',
  ],
  [/text-transform\s*:\s*uppercase/, 'caixa-alta (estilo editorial é proibido)'],
  [/font-family\s*:[^;]*(?<!sans-)\bserif\b/, 'fonte serifada'],
  [/stroke-linecap\s*:\s*(round|square)/, 'ponta de traço que não é butt'],
  [/@font-face/, '@font-face fora do next/font (fontes só em src/site/fontes)'],
  [/prefers-reduced-motion/, 'reduced-motion (decisão: animar para todos)'],
]

const REGRAS_CODIGO: readonly Regra[] = [
  [
    /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/,
    'cor em hex no código (use token, via corDoToken)',
  ],
  [/from\s+['"]next\/link['"]/, 'next/link (links internos do site v2 são <a>)'],
  [/prefers-reduced-motion|useReducedHeavy/, 'reduced-motion (decisão: animar para todos)'],
]

/** Spec 2, README do protótipo e regras de conformidade de 27/07/2026. */
export const TERMOS_VEDADOS: readonly string[] = [
  'tempo real',
  'validade jurídica',
  'menor inadimplência do mercado',
  'melhor do Brasil',
  '5ª melhor',
  'assessoria jurídica',
  'jurídico próprio',
  'time jurídico',
  'assumimos a operação',
  'a única do Norte',
  'a única do Nordeste',
  'ranking nacional',
]

function normalizar(texto: string): string {
  return texto.replace(/\r\n?/g, '\n')
}

/** Comentários e blocos :root viram espaço, preservando as quebras (a linha apontada não muda). */
function semRootNemComentario(css: string): string {
  const branco = (trecho: string) => trecho.replace(/[^\n]/g, ' ')
  return css.replace(/\/\*[\s\S]*?\*\//g, branco).replace(/:root\s*\{[\s\S]*?\n\}/g, branco)
}

function aplicar(texto: string, arquivo: string, regras: readonly Regra[]): Violacao[] {
  const violacoes: Violacao[] = []
  texto.split('\n').forEach((conteudoDaLinha, indice) => {
    for (const [padrao, motivo] of regras) {
      if (padrao.test(conteudoDaLinha)) violacoes.push({ arquivo, linha: indice + 1, motivo })
    }
  })
  return violacoes
}

export function verificarCss(texto: string, arquivo: string): Violacao[] {
  return aplicar(semRootNemComentario(normalizar(texto)), arquivo, REGRAS_CSS)
}

export function verificarCodigo(texto: string, arquivo: string): Violacao[] {
  return aplicar(normalizar(texto), arquivo, REGRAS_CODIGO)
}

export function procurarTermosVedados(texto: string): string[] {
  const baixo = texto.toLocaleLowerCase('pt-BR')
  return TERMOS_VEDADOS.filter((termo) => baixo.includes(termo.toLocaleLowerCase('pt-BR')))
}

/** Todas as strings de um valor (objeto, lista ou string), em profundidade. */
export function textosDe(valor: unknown): string[] {
  if (typeof valor === 'string') return [valor]
  if (Array.isArray(valor)) return valor.flatMap(textosDe)
  if (valor !== null && typeof valor === 'object') return Object.values(valor).flatMap(textosDe)
  return []
}

export function listarArquivos(raiz: string, extensoes: readonly string[]): string[] {
  return readdirSync(raiz, { withFileTypes: true }).flatMap((item) => {
    const caminho = path.join(raiz, item.name)
    if (item.isDirectory()) return listarArquivos(caminho, extensoes)
    return extensoes.some((ext) => item.name.endsWith(ext)) ? [caminho] : []
  })
}

/** Como `listarArquivos`, mas uma pasta que ainda não existe (ex.: `src/app/(site)`) vale como vazia. */
export function listarSeExiste(raiz: string, extensoes: readonly string[]): string[] {
  return existsSync(raiz) ? listarArquivos(raiz, extensoes) : []
}
