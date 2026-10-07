import { describe, expect, it } from 'vitest'
import { normalizarCodigo, refValida } from '@/lib/segundaVia/formatos'

describe('código (Review Focus 2)', () => {
  it.each(['123456', '123 456', '123-456', ' 123456 '])('aceita %j', (v) => {
    expect(normalizarCodigo(v)).toBe('123456')
  })
  it.each(['12345', '1234567', '12a456', ''])('recusa %j', (v) => {
    expect(normalizarCodigo(v)).toBeNull()
  })
})

describe('refValida', () => {
  const ref22 = 'A'.repeat(22)
  it('aceita 22 e 43 caracteres do alfabeto base64url', () => {
    expect(refValida(ref22)).toBe(true)
    expect(refValida(`${'a-_9'.repeat(10)}ab`)).toBe(true)
    expect(refValida('B'.repeat(43))).toBe(true)
  })
  it('recusa tamanho fora da faixa, caracteres estranhos e não string', () => {
    expect(refValida('A'.repeat(21))).toBe(false)
    expect(refValida('A'.repeat(44))).toBe(false)
    expect(refValida(`${'A'.repeat(21)}=`)).toBe(false)
    expect(refValida(`${'A'.repeat(21)}\n`)).toBe(false)
    expect(refValida(undefined)).toBe(false)
    expect(refValida(123)).toBe(false)
  })
})
