import { gsap } from 'gsap'
import { afterEach, describe, expect, it } from 'vitest'
import {
  aoImprimir,
  desligarTudo,
  executarGanchosImpressao,
  registrarDesligamento,
} from '@/site/core/ganchos'
import { pausasDaTimeline, snapNaDirecao, snapPatamares } from '@/site/core/patamares'
import { aoRolar, corDoToken, familiaDaFonte, revelarQuadro } from '@/site/core/util'

afterEach(() => {
  desligarTudo()
  document.documentElement.removeAttribute('style')
})

describe('patamares de leitura tirados da coreografia', () => {
  const alvo = { x: 0, y: 0 }

  it('o meio de cada pausa vira patamar, mais o começo e o fim', () => {
    const tl = gsap.timeline({ paused: true })
    tl.to(alvo, { x: 1, duration: 1 }, 0)
      .to({}, { duration: 1 }, 1)
      .to(alvo, { x: 2, duration: 1 }, 2)
    expect(pausasDaTimeline(tl)).toEqual([0, 0.5, 1])
  })

  it('movimento marcado como respiro não desfaz a pausa; sem a marca, desfaz', () => {
    const comRespiro = gsap.timeline({ paused: true })
    comRespiro
      .to(alvo, { x: 1, duration: 1 }, 0)
      .to(alvo, { y: 1, duration: 1, data: 'respiro' }, 1)
      .to(alvo, { x: 2, duration: 1 }, 2)
    expect(pausasDaTimeline(comRespiro)).toEqual([0, 0.5, 1])

    const semRespiro = gsap.timeline({ paused: true })
    semRespiro
      .to(alvo, { x: 1, duration: 1 }, 0)
      .to(alvo, { y: 1, duration: 1 }, 1)
      .to(alvo, { x: 2, duration: 1 }, 2)
    expect(pausasDaTimeline(semRespiro)).toEqual([0, 1])
  })

  it('timeline aninhada conta no tempo da raiz; timeline vazia vira [0, 1]', () => {
    const filha = gsap.timeline().to(alvo, { x: 1, duration: 1 })
    const raiz = gsap.timeline({ paused: true })
    raiz.add(filha, 0).to(alvo, { x: 2, duration: 1 }, 2)
    expect(pausasDaTimeline(raiz)).toEqual([0, 0.5, 1])
    expect(pausasDaTimeline(gsap.timeline({ paused: true }))).toEqual([0, 1])
  })

  it('o snap anda na direção do gesto', () => {
    expect(snapNaDirecao([0, 0.5, 1], 0.4, 1)).toBe(0.5)
    expect(snapNaDirecao([0, 0.5, 1], 0.4, -1)).toBe(0)
  })

  it('sem toque não há snap; com toque, sem inércia somada e com duração curta', () => {
    expect(snapPatamares(() => [0, 1], false)).toBeUndefined()
    const snap = snapPatamares(() => [0, 0.5, 1], true)
    expect(snap).toMatchObject({ inertia: false, duration: { min: 0.25, max: 0.6 }, delay: 0.08 })
  })
})

describe('ganchos de desmonte e de impressão', () => {
  it('registrarDesligamento roda uma vez só, mesmo chamado de novo', () => {
    let vezes = 0
    const desligar = registrarDesligamento(() => {
      vezes += 1
    })
    desligar()
    desligar()
    expect(desligarTudo()).toEqual([])
    expect(vezes).toBe(1)
  })

  it('desligarTudo devolve os erros e esquece os ganchos de impressão', () => {
    let impressos = 0
    aoImprimir(() => {
      impressos += 1
    })
    registrarDesligamento(() => {
      throw new Error('falhou ao desligar')
    })
    expect(desligarTudo()).toHaveLength(1)
    executarGanchosImpressao(() => undefined)
    expect(impressos).toBe(0)
  })

  it('gancho de impressão que falha é reportado e não impede os outros', () => {
    const reportados: Array<[unknown, string]> = []
    let rodou = false
    aoImprimir(() => {
      throw new Error('gancho ruim')
    })
    aoImprimir(() => {
      rodou = true
    })
    executarGanchosImpressao((erro, origem) => reportados.push([erro, origem]))
    expect(rodou).toBe(true)
    expect(reportados).toHaveLength(1)
    expect(reportados[0]?.[1]).toBe('impressão')
  })
})

describe('utilidades das cenas', () => {
  it('revelarQuadro sem .moldura > img reporta a falha e devolve null (não só console)', () => {
    const reportados: Array<[unknown, string]> = []
    const quadro = document.createElement('figure')
    expect(revelarQuadro(quadro, (erro, origem) => reportados.push([erro, origem]))).toBeNull()
    expect(reportados).toHaveLength(1)
    expect(reportados[0]?.[1]).toBe('quadro')
  })

  it('aoRolar chama no máximo uma vez por quadro e para depois de desligar', () => {
    let chamadas = 0
    const desligar = aoRolar(() => {
      chamadas += 1
    })
    gsap.ticker.tick()
    expect(chamadas).toBe(1)
    gsap.ticker.tick()
    expect(chamadas).toBe(1)
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('scroll'))
    gsap.ticker.tick()
    expect(chamadas).toBe(2)
    desligar()
    window.dispatchEvent(new Event('scroll'))
    gsap.ticker.tick()
    expect(chamadas).toBe(2)
  })

  it('corDoToken lê o hex do :root; token que não é hex de 6 dígitos é erro', () => {
    document.documentElement.style.setProperty('--marinho', '#1b2d70')
    expect(corDoToken('--marinho')).toEqual([27, 45, 112])
    expect(() => corDoToken('--inexistente')).toThrow(/não é hex/)
  })

  it('familiaDaFonte devolve a família real do next/font e acusa variável ausente', () => {
    document.documentElement.style.setProperty(
      '--fonte-saira',
      "'__Saira_a1b2c3', '__Saira_Fallback_a1b2c3'",
    )
    expect(familiaDaFonte('--fonte-saira')).toBe("'__Saira_a1b2c3', '__Saira_Fallback_a1b2c3'")
    expect(() => familiaDaFonte('--fonte-barlow')).toThrow(/vazio/)
  })
})
