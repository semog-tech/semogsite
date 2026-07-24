import { describe, expect, it } from 'vitest'
import {
  FADE_MS,
  nextIndex,
  PRELOAD_LEAD_S,
  sequenceFor,
  shouldFade,
  shouldPreload,
} from '@/motion/videoSequence'

describe('sequenceFor', () => {
  it('mantém todos os clipes no desktop', () => {
    expect(sequenceFor(['a.mp4', 'b.mp4', 'c.mp4'], false)).toEqual(['a.mp4', 'b.mp4', 'c.mp4'])
  })

  it('usa só o primeiro clipe no mobile', () => {
    expect(sequenceFor(['a.mp4', 'b.mp4', 'c.mp4'], true)).toEqual(['a.mp4'])
  })

  it('não quebra com lista vazia', () => {
    expect(sequenceFor([], true)).toEqual([])
    expect(sequenceFor([], false)).toEqual([])
  })
})

describe('nextIndex', () => {
  it('avança e cicla', () => {
    expect(nextIndex(0, 4)).toBe(1)
    expect(nextIndex(3, 4)).toBe(0)
  })

  it('com um clipe só, fica sempre no mesmo', () => {
    expect(nextIndex(0, 1)).toBe(0)
  })

  it('com lista vazia, devolve 0 em vez de NaN', () => {
    expect(nextIndex(0, 0)).toBe(0)
  })
})

describe('shouldFade', () => {
  it('é falso no meio do clipe', () => {
    expect(shouldFade(2, 10, 1.4)).toBe(false)
  })

  it('é verdadeiro dentro da janela de crossfade', () => {
    expect(shouldFade(8.7, 10, 1.4)).toBe(true)
  })

  it('é falso enquanto a duração não é conhecida', () => {
    expect(shouldFade(2, 0, 1.4)).toBe(false)
    expect(shouldFade(2, Number.NaN, 1.4)).toBe(false)
  })
})

describe('shouldPreload', () => {
  it('é falso no começo do clipe', () => {
    expect(shouldPreload(1, 10, 3)).toBe(false)
  })

  it('vira verdadeiro antes do crossfade começar', () => {
    expect(shouldPreload(7.1, 10, 3)).toBe(true)
    // a janela de preload (3s) abre antes da de fade (1,4s) — é isso que
    // garante que o próximo clipe esteja pronto quando o fade começar
    expect(shouldFade(7.1, 10, 1.4)).toBe(false)
  })

  it('é falso enquanto a duração não é conhecida', () => {
    expect(shouldPreload(1, 0, 3)).toBe(false)
    expect(shouldPreload(1, Number.NaN, 3)).toBe(false)
  })
})

describe('constantes', () => {
  it('a janela de preload é maior que a de fade', () => {
    expect(PRELOAD_LEAD_S * 1000).toBeGreaterThan(FADE_MS)
  })
})
