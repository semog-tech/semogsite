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
  ['cena abertura', () => import('@/site/cenas/home/abertura')],
  ['cena condomínios', () => import('@/site/cenas/home/condominios')],
  ['cena pilares', () => import('@/site/cenas/home/pilares')],
  ['cena ranking', () => import('@/site/cenas/home/ranking')],
  ['cena unidades', () => import('@/site/cenas/home/unidades')],
  ['cena tecnologia', () => import('@/site/cenas/home/tecnologia')],
  ['tecnologia: base', () => import('@/site/cenas/home/tecnologia-base')],
  ['tecnologia: desenho', () => import('@/site/cenas/home/tecnologia-desenho')],
  ['tecnologia: layout', () => import('@/site/cenas/home/tecnologia-layout')],
  ['tecnologia: percurso', () => import('@/site/cenas/home/tecnologia-percurso')],
  ['tecnologia: poses', () => import('@/site/cenas/home/tecnologia-poses')],
  ['cena comunidade', () => import('@/site/cenas/home/comunidade')],
  ['cena proposta', () => import('@/site/cenas/proposta')],
  ['cenas da home', () => import('@/site/cenas/paginas/home')],
  ['cena manifesto', () => import('@/site/cenas/semog/manifesto')],
  ['cena história', () => import('@/site/cenas/semog/historia')],
  ['cena princípios', () => import('@/site/cenas/semog/principios')],
  ['cena pessoas', () => import('@/site/cenas/semog/pessoas')],
  ['cena depoimentos', () => import('@/site/cenas/semog/depoimentos')],
  ['cena assembleia', () => import('@/site/cenas/semog/assembleia')],
  ['cenas de A Semog', () => import('@/site/cenas/paginas/semog')],
  ['dinâmica', () => import('@/site/core/dinamica')],
  ['formulário: textos', () => import('@/site/formularios/proposta/textos')],
  ['formulário: leitura', () => import('@/site/formularios/proposta/leitura')],
  ['formulário: cortina', () => import('@/site/formularios/proposta/cortina')],
  ['leitura', () => import('@/site/leitura/ligar-leitura')],
  ['leitura: componente', () => import('@/site/leitura/LigarLeitura')],
]

describe('site v2: módulos do cliente carregam no servidor', () => {
  it('roda mesmo sem window', () => {
    expect(typeof window).toBe('undefined')
  })

  it.each(MODULOS)('%s importa sem tocar no navegador', async (_nome, carregar) => {
    await expect(carregar()).resolves.toBeDefined()
  })
})
