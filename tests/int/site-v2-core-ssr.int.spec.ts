// @vitest-environment node
import { describe, expect, it } from 'vitest'

/**
 * O Next renderiza Client Components no servidor: o RunnerDeCenas e tudo o que ele importa
 * (core, conteúdo, cenas) é avaliado em Node antes de qualquer efeito. O protótipo chamava
 * `window.matchMedia` no topo de `util.js` e `motion.js`; no Next isso derruba a página com
 * 500. Este arquivo roda em Node puro (sem jsdom) para travar a regra.
 */
const MODULOS: ReadonlyArray<readonly [string, () => Promise<unknown>]> = [
  ['conteudo', () => import('@/site/conteudo/conteudo')],
  ['ganchos', () => import('@/site/core/ganchos')],
  ['patamares', () => import('@/site/core/patamares')],
  ['util', () => import('@/site/core/util')],
  ['motion', () => import('@/site/core/motion')],
  ['posicao', () => import('@/site/core/posicao')],
  ['tema', () => import('@/site/core/tema')],
  ['impressao', () => import('@/site/core/impressao')],
  ['cabecalho', () => import('@/site/core/cabecalho')],
  ['montagem', () => import('@/site/core/montagem')],
  ['registro', () => import('@/site/cenas/registro')],
  ['runner', () => import('@/site/runner/RunnerDeCenas')],
  ['cena ranking', () => import('@/site/cenas/home/ranking')],
]

describe('site v2: módulos do cliente carregam no servidor', () => {
  it('roda mesmo sem window', () => {
    expect(typeof window).toBe('undefined')
  })

  it.each(MODULOS)('%s importa sem tocar no navegador', async (_nome, carregar) => {
    await expect(carregar()).resolves.toBeDefined()
  })
})
