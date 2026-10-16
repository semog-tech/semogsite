import { render } from '@testing-library/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type Lenis from 'lenis'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { montarPagina, type Reportar } from '@/site/core/montagem'
import type { ListaCenas } from '@/site/core/tipos'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

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

describe('montarPagina: falha fora das cenas', () => {
  afterEach(() => {
    history.replaceState(null, '', '/')
  })

  it('erro ao assentar a posição é reportado, desliga o Lenis e não lança', () => {
    palco('a')
    history.replaceState(null, '', '#a')
    const desligar = vi.fn()
    // Só o que `rolarAgora` usa: o `resize` lança para simular o Lenis quebrando no assentar.
    const lenisQuebrado = {
      resize: () => {
        throw new Error('resize quebrou')
      },
      scrollTo: vi.fn(),
    } as unknown as Lenis // dublê parcial: o tipo completo do Lenis não importa aqui
    const criarLenis = vi.fn(() => ({ lenis: lenisQuebrado, desligar }))
    let desmontar: () => void = () => undefined
    expect(() => {
      desmontar = montarPagina([['a', () => undefined]], { reportar, criarLenis })
    }).not.toThrow()
    expect(reportar).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'resize quebrou' }),
      'montagem',
    )
    expect(desligar).toHaveBeenCalledTimes(1)
    expect(gsap.context()).toBeFalsy()
    expect(ScrollTrigger.getAll()).toHaveLength(0)
    desmontar()
    expect(desligar).toHaveBeenCalledTimes(1)
  })
})

describe('montarPagina: html.motion', () => {
  it('a classe é marcada quando a página fica pronta e sai no desmonte', async () => {
    palco('a')
    let pronto: Promise<void> | null = null
    const desmontar = montarPagina(
      [
        [
          'a',
          (ctx) => {
            pronto = ctx.pronto
          },
        ],
      ],
      { reportar, criarLenis: lenisFalso() },
    )
    expect(pronto).not.toBeNull()
    await pronto
    expect(document.documentElement.classList.contains('motion')).toBe(true)
    desmontar()
    expect(document.documentElement.classList.contains('motion')).toBe(false)
    expect(reportar).not.toHaveBeenCalled()
  })
})

describe('montarPagina: cena que quebra não deixa callback vivo', () => {
  it('aoRolar registrado antes do erro é desligado; o da outra cena continua', () => {
    palco('a', 'b')
    let chamadasA = 0
    let chamadasB = 0
    const desmontar = montarPagina(
      [
        [
          'a',
          (ctx) => {
            ctx.util.aoRolar(() => {
              chamadasA += 1
            }, ctx.lenis)
            throw new Error('quebrou depois de ligar')
          },
        ],
        [
          'b',
          (ctx) => {
            ctx.util.aoRolar(() => {
              chamadasB += 1
            }, ctx.lenis)
          },
        ],
      ],
      { reportar, criarLenis: lenisFalso() },
    )
    chamadasA = 0
    chamadasB = 0
    window.dispatchEvent(new Event('scroll'))
    gsap.ticker.tick()
    expect(chamadasA).toBe(0)
    expect(chamadasB).toBe(1)
    desmontar()
  })

  it('cena que quebra devolve à seção as classes e os data-* de antes do init', () => {
    palco('a')
    const secao = document.getElementById('a')
    secao?.classList.add('cena')
    const desmontar = montarPagina(
      [
        [
          'a',
          (ctx) => {
            // O CSS de palco fixado depende destas marcas; sem a cena, o texto ficaria sobreposto.
            ctx.root.classList.add('ranking-com-palco')
            ctx.root.dataset.patamares = '0 1'
            ctx.root.dataset.tema = 'escuro'
            throw new Error('quebrou depois de marcar')
          },
        ],
      ],
      { reportar, criarLenis: lenisFalso() },
    )
    expect(secao?.className).toBe('cena')
    expect(secao?.dataset.patamares).toBeUndefined()
    expect(secao?.dataset.tema).toBe('claro')
    expect(secao?.dataset.cenaErro).toBe('')
    desmontar()
  })

  it('desligamento registrado por util.registrarDesligamento roda quando a cena quebra', () => {
    palco('a')
    const desligar = vi.fn()
    const desmontar = montarPagina(
      [
        [
          'a',
          (ctx) => {
            ctx.util.registrarDesligamento(desligar)
            throw new Error('quebrou depois de ligar')
          },
        ],
      ],
      { reportar, criarLenis: lenisFalso() },
    )
    expect(desligar).toHaveBeenCalledTimes(1)
    desmontar()
    expect(desligar).toHaveBeenCalledTimes(1)
  })
})

describe('RunnerDeCenas', () => {
  it('no StrictMode (monta, desmonta, monta) fica um conjunto só, sem erro no Sentry', async () => {
    const Sentry = await import('@sentry/nextjs')
    const { RunnerDeCenas } = await import('@/site/runner/RunnerDeCenas')
    palco('a')
    const { unmount } = render(
      <StrictMode>
        <RunnerDeCenas
          pagina="teste"
          cenas={[
            [
              'a',
              (ctx) => {
                ctx.ScrollTrigger.create({ trigger: ctx.root })
              },
            ],
          ]}
        />
      </StrictMode>,
    )
    expect(ScrollTrigger.getAll()).toHaveLength(1)
    expect(Sentry.captureException).not.toHaveBeenCalled()
    unmount()
    expect(ScrollTrigger.getAll()).toHaveLength(0)
  })
})
