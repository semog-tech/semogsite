import { render } from '@testing-library/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { montarPagina, type Reportar } from '@/site/core/montagem'
import type { ListaCenas } from '@/site/core/tipos'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/site/cenas/registro', () => ({
  CENAS_POR_PAGINA: {
    previa: [
      [
        'a',
        (ctx: import('@/site/core/tipos').ContextoCena) => {
          ctx.ScrollTrigger.create({ trigger: ctx.root })
        },
      ],
    ],
  },
}))

class ResizeObserverFalso {
  observe = (): void => undefined
  unobserve = (): void => undefined
  disconnect = (): void => undefined
}

function palco(...ids: string[]): void {
  const secoes = ids.map((id) => `<section id="${id}" data-tema="claro"></section>`).join('')
  document.body.innerHTML = `<header data-cabecalho data-tema="claro"></header><main>${secoes}</main>`
}

const lenisFalso = () => vi.fn(() => ({ lenis: null, desligar: vi.fn() }))

let reportar: Mock<Reportar>

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverFalso)
  reportar = vi.fn<Reportar>()
})

afterEach(() => {
  for (const gatilho of ScrollTrigger.getAll()) gatilho.kill()
  vi.unstubAllGlobals()
})

describe('montarPagina: cena que quebra não derruba a página', () => {
  it('erro síncrono: reporta com a tag da cena, a seção fica em HTML e a seguinte monta', () => {
    palco('a', 'b')
    let bMontou = false
    const cenas: ListaCenas = [
      [
        'a',
        () => {
          throw new Error('quebrou')
        },
      ],
      [
        'b',
        () => {
          bMontou = true
        },
      ],
    ]
    const desmontar = montarPagina(cenas, { reportar, criarLenis: lenisFalso() })
    expect(reportar).toHaveBeenCalledWith(expect.objectContaining({ message: 'quebrou' }), 'cena:a')
    expect(document.getElementById('a')?.dataset.cenaErro).toBe('')
    expect(bMontou).toBe(true)
    // O GSAP 3.15 não restaura o contexto global se o init lança dentro do `add`: a montagem
    // captura o erro dentro da função, então nenhum contexto fica preso.
    expect(gsap.context()).toBeFalsy()
    desmontar()
  })

  it('ctx.reportar leva a falha parcial ao Sentry com a origem da cena, sem derrubar a seção', () => {
    palco('a')
    const desmontar = montarPagina(
      [
        [
          'a',
          (ctx) => {
            ctx.reportar(new Error('parcial'), 'quadro')
          },
        ],
      ],
      { reportar, criarLenis: lenisFalso() },
    )
    expect(reportar).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'parcial' }),
      'cena:a:quadro',
    )
    expect(document.getElementById('a')?.dataset.cenaErro).toBeUndefined()
    desmontar()
  })

  it('promise rejeitada também é reportada', async () => {
    palco('a')
    const desmontar = montarPagina([['a', async () => Promise.reject(new Error('tarde'))]], {
      reportar,
      criarLenis: lenisFalso(),
    })
    await vi.waitFor(() =>
      expect(reportar).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'tarde' }),
        'cena:a',
      ),
    )
    desmontar()
  })

  it('seção ausente é reportada, não ignorada', () => {
    palco()
    const desmontar = montarPagina([['fantasma', () => undefined]], {
      reportar,
      criarLenis: lenisFalso(),
    })
    expect(reportar).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('fantasma') }),
      'cena:fantasma',
    )
    desmontar()
  })
})

describe('montarPagina: desmonte e ida e volta', () => {
  it('o desmonte reverte o que a cena fez e chama a limpeza que ela devolveu', () => {
    palco('a')
    let limpou = false
    const desmontar = montarPagina(
      [
        [
          'a',
          (ctx) => {
            ctx.gsap.set(ctx.root, { x: 10 })
            return () => {
              limpou = true
            }
          },
        ],
      ],
      { reportar, criarLenis: lenisFalso() },
    )
    expect(document.getElementById('a')?.style.transform).not.toBe('')
    desmontar()
    expect(document.getElementById('a')?.style.transform).toBe('')
    expect(limpou).toBe(true)
    expect(reportar).not.toHaveBeenCalled()
  })

  it('três ciclos de montar e desmontar não acumulam gatilho, rolagem nem Lenis', () => {
    palco('a')
    let chamadas = 0
    const criarLenis = lenisFalso()
    const cenas: ListaCenas = [
      [
        'a',
        (ctx) => {
          ctx.ScrollTrigger.create({ trigger: ctx.root })
          ctx.util.aoRolar(() => {
            chamadas += 1
          }, ctx.lenis)
        },
      ],
    ]
    const contagens: number[] = []
    for (let ciclo = 0; ciclo < 3; ciclo += 1) {
      const desmontar = montarPagina(cenas, { reportar, criarLenis })
      contagens.push(ScrollTrigger.getAll().length)
      desmontar()
    }
    expect(new Set(contagens).size).toBe(1)
    expect(ScrollTrigger.getAll()).toHaveLength(0)
    chamadas = 0
    window.dispatchEvent(new Event('scroll'))
    gsap.ticker.tick()
    expect(chamadas).toBe(0)
    expect(criarLenis).toHaveBeenCalledTimes(3)
    for (const resultado of criarLenis.mock.results) {
      expect(resultado.value.desligar).toHaveBeenCalledTimes(1)
    }
    expect(document.documentElement.classList.contains('motion')).toBe(false)
    expect(reportar).not.toHaveBeenCalled()
  })
})

describe('RunnerDeCenas', () => {
  it('no StrictMode (monta, desmonta, monta) fica um conjunto só, sem erro no Sentry', async () => {
    const Sentry = await import('@sentry/nextjs')
    const { RunnerDeCenas } = await import('@/site/runner/RunnerDeCenas')
    palco('a')
    const { unmount } = render(
      <StrictMode>
        <RunnerDeCenas pagina="previa" />
      </StrictMode>,
    )
    expect(ScrollTrigger.getAll()).toHaveLength(1)
    expect(Sentry.captureException).not.toHaveBeenCalled()
    unmount()
    expect(ScrollTrigger.getAll()).toHaveLength(0)
  })
})
