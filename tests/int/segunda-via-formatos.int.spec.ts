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
  it.each([
    ['desafio', 43],
    ['sessao', 43],
    ['referencia', 22],
  ] as const)('%s: aceita só o tamanho exato (%i)', (tipo, tamanho) => {
    expect(refValida('a-_9'.repeat(11).slice(0, tamanho), tipo)).toBe(true)
    expect(refValida('A'.repeat(tamanho - 1), tipo)).toBe(false)
    expect(refValida('A'.repeat(tamanho + 1), tipo)).toBe(false)
  })
  it('um tipo não aceita o tamanho do outro', () => {
    expect(refValida('A'.repeat(22), 'sessao')).toBe(false)
    expect(refValida('A'.repeat(43), 'referencia')).toBe(false)
  })
  it('recusa caracteres estranhos e não string', () => {
    expect(refValida(`${'A'.repeat(21)}=`, 'referencia')).toBe(false)
    expect(
      refValida(
        `${'A'.repeat(21)}
`,
        'referencia',
      ),
    ).toBe(false)
    expect(refValida(undefined, 'desafio')).toBe(false)
    expect(refValida(123, 'desafio')).toBe(false)
  })
})
