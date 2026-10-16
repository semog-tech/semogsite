import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import ErroDoSite from '@/app/(site)/error'
import { montarPagina, type Reportar } from '@/site/core/montagem'
import { DesmontadoAntesDoPronto, marcarMotionQuandoPronto } from '@/site/core/motion'
import { pausasDaTimeline } from '@/site/core/patamares'
import { listarArquivos, listarSeExiste } from './helpers/identidade'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

class ResizeObserverFalso {
  observe = (): void => undefined
  unobserve = (): void => undefined
  disconnect = (): void => undefined
}

const semLenis = () => ({ lenis: null, desligar: () => undefined })

function paginaCarregando(): void {
  Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true })
}

let reportar: Mock<Reportar>
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverFalso)
  reportar = vi.fn<Reportar>()
  document.body.innerHTML =
    '<header data-cabecalho data-tema="claro"></header><main><section id="a" data-tema="claro"></section></main>'
})
afterEach(() => {
  Reflect.deleteProperty(document, 'readyState')
  for (const gatilho of ScrollTrigger.getAll()) gatilho.kill()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('patamares: tween que só anima por onUpdate (Task 1.4 da fase 1)', () => {
  it('sem data "movimento" o tween de callback é pausa; com ela, é movimento', () => {
    const alvo = { x: 0 }
    const montar = (data?: string) =>
      gsap
        .timeline({ paused: true })
        .to(alvo, { x: 1, duration: 1 })
        .to({}, { duration: 1, onUpdate: () => undefined, ...(data ? { data } : {}) })
        .to(alvo, { x: 2, duration: 1 })
    expect(pausasDaTimeline(montar())).toEqual([0, 0.5, 1])
    expect(pausasDaTimeline(montar('movimento'))).toEqual([0, 1])
  })

  it('toda cena portada marca o tween de callback (receita C8)', () => {
    const raiz = path.join(process.cwd(), 'src', 'site', 'cenas')
    const semMarca = listarArquivos(raiz, ['.ts']).flatMap((arquivo) => {
      const fonte = readFileSync(arquivo, 'utf8').replace(/\r\n?/g, '\n')
      return Array.from(fonte.matchAll(/\.(?:to|fromTo)\(\s*\{\s*\}\s*,\s*\{([^}]*)\}/g))
        .filter(
          ([, opcoes]) => opcoes.includes('onUpdate') && !opcoes.includes("data: 'movimento'"),
        )
        .map(() => path.relative(process.cwd(), arquivo))
    })
    expect(semMarca).toEqual([])
  })
})

describe('motion: desmontar antes do load (Task 1.5 da fase 1)', () => {
  it('cancelar rejeita o pronto com DesmontadoAntesDoPronto, em vez de deixá-lo pendente', async () => {
    paginaCarregando()
    const motion = marcarMotionQuandoPronto()
    motion.cancelar()
    await expect(motion.pronto).rejects.toBeInstanceOf(DesmontadoAntesDoPronto)
    expect(document.documentElement.classList.contains('motion')).toBe(false)
  })

  it('a cena que espera o pronto não vai ao Sentry quando a página desmonta antes', async () => {
    paginaCarregando()
    const desmontar = montarPagina(
      [
        [
          'a',
          async (ctx) => {
            await ctx.pronto
          },
        ],
      ],
      { reportar, criarLenis: semLenis },
    )
    desmontar()
    await new Promise((resolver) => setTimeout(resolver, 0))
    expect(reportar).not.toHaveBeenCalled()
  })
})

describe('montagem: cena assíncrona que falha depois de um await (Task 1.6 da fase 1)', () => {
  it('desliga o aoRolar ligado depois do await e reporta a cena', async () => {
    const remover = vi.spyOn(window, 'removeEventListener')
    let liberar: () => void = () => undefined
    const espera = new Promise<void>((resolver) => {
      liberar = resolver
    })
    const desmontar = montarPagina(
      [
        [
          'a',
          async (ctx) => {
            await espera
            ctx.util.aoRolar(() => undefined)
            throw new Error('quebrou depois do await')
          },
        ],
      ],
      { reportar, criarLenis: semLenis },
    )
    liberar()
    await new Promise((resolver) => setTimeout(resolver, 0))
    expect(reportar).toHaveBeenCalledWith(expect.any(Error), 'cena:a')
    expect(remover).toHaveBeenCalledWith('scroll', expect.any(Function))
    desmontar()
  })
})

describe('error.tsx do (site) (Task 1.7 da fase 1)', () => {
  it('mostra a tela v2 com Tentar de novo e o início, e chama o retry', () => {
    const retry = vi.fn()
    render(<ErroDoSite error={new Error('teste')} unstable_retry={retry} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Algo não carregou.')
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(retry).toHaveBeenCalledTimes(1)
    expect(
      screen.getByRole('link', { name: 'Ir para a página inicial' }).getAttribute('href'),
    ).toBe('/')
    // A tela substitui a página inteira (sem esqueleto): a seta só desenha com o símbolo aqui.
    expect(document.querySelector('symbol#seta')).not.toBeNull()
  })
})

describe('fronteira servidor → cliente das cenas (DP4)', () => {
  it('nenhum Server Component importa o RunnerDeCenas ou uma cena: só o módulo client da página', () => {
    // Função não atravessa a fronteira RSC: a lista de cenas escrita numa page.tsx derruba o
    // prerender no `pnpm build`, e o jsdom deste teste não acusaria. `import type` não conta.
    const raizes = [
      path.join(process.cwd(), 'src', 'app', '(site)'),
      path.join(process.cwd(), 'src', 'site', 'paginas'),
      path.join(process.cwd(), 'src', 'site', 'layout'),
    ]
    const acusados = raizes
      .flatMap((raiz) => listarSeExiste(raiz, ['.ts', '.tsx']))
      .filter((arquivo) => {
        const fonte = readFileSync(arquivo, 'utf8').replace(/\r\n?/g, '\n')
        if (/^'use client'/.test(fonte.trimStart())) return false
        return Array.from(fonte.matchAll(/^import ([^']*?) from '([^']+)'/gm)).some(
          ([, nomes, origem]) =>
            !nomes.startsWith('type ') &&
            /^@\/site\/(?:runner\/RunnerDeCenas$|cenas\/(?!paginas\/|registro$))/.test(origem),
        )
      })
      .map((arquivo) => path.relative(process.cwd(), arquivo))
    expect(acusados).toEqual([])
  })
})
