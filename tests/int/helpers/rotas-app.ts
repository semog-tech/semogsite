import { readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

export type RotaDoApp = { segmentos: string[]; arquivo: 'page' | 'route' | 'opengraph-image' }

const ARQUIVOS = new Set(['page', 'route', 'opengraph-image'])
const RAIZ = join(process.cwd(), 'src', 'app')

function percorrer(pasta: string, saida: RotaDoApp[]): void {
  for (const entrada of readdirSync(pasta, { withFileTypes: true })) {
    const caminho = join(pasta, entrada.name)
    if (entrada.isDirectory()) {
      percorrer(caminho, saida)
      continue
    }
    const nome = entrada.name.replace(/\.(tsx?|jsx?)$/, '')
    if (!ARQUIVOS.has(nome)) continue
    const segmentos = relative(RAIZ, pasta)
      .split(sep)
      .filter((parte) => parte !== '' && !/^\(.*\)$/.test(parte)) // route group não entra na URL
    if (nome === 'opengraph-image') segmentos.push('opengraph-image')
    saida.push({ segmentos, arquivo: nome as RotaDoApp['arquivo'] }) // `nome` é um dos três de ARQUIVOS
  }
}

/** Rotas de `src/app` que respondem uma URL: página, route handler e imagem OG. */
export function rotasDoApp(): RotaDoApp[] {
  const saida: RotaDoApp[] = []
  percorrer(RAIZ, saida)
  return saida
}

/** 2 = literal, 1 = dinâmico, 0 = catch-all: o Next prefere o segmento mais específico. */
function peso(segmento: string): number {
  if (/^\[\[?\.\.\./.test(segmento)) return 0
  return segmento.startsWith('[') ? 1 : 2
}

function casa(rota: string[], url: string[]): boolean {
  for (const [i, segmento] of rota.entries()) {
    if (peso(segmento) === 0) return segmento.startsWith('[[') || url.length > i
    const alvo = url[i]
    if (alvo === undefined) return false
    if (peso(segmento) === 2 && segmento !== alvo) return false
  }
  return rota.length === url.length
}

function maisEspecifica(a: RotaDoApp, b: RotaDoApp): number {
  for (let i = 0; i < Math.max(a.segmentos.length, b.segmentos.length); i++) {
    const pa = a.segmentos[i] === undefined ? -1 : peso(a.segmentos[i] ?? '')
    const pb = b.segmentos[i] === undefined ? -1 : peso(b.segmentos[i] ?? '')
    if (pa !== pb) return pb - pa
  }
  return 0
}

/** A rota que o Next serve para um caminho (`/blog/opengraph-image`), ou `undefined` (404). */
export function rotaQueAtende(caminho: string, rotas: readonly RotaDoApp[]): RotaDoApp | undefined {
  const url = caminho.split('/').filter(Boolean)
  return rotas.filter((rota) => casa(rota.segmentos, url)).sort(maisEspecifica)[0]
}
