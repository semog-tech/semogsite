import { describe, expect, it } from 'vitest'
import { cpfValido, mascararCpf, somenteDigitos } from '@/lib/cpf'

describe('cpf', () => {
  it.each(['529.982.247-25', '52998224725'])('aceita %s', (v) => {
    expect(cpfValido(v)).toBe(true)
  })
  it.each(['111.111.111-11', '52998224724', '5299822472', ''])('recusa %j', (v) => {
    expect(cpfValido(v)).toBe(false)
  })
  it('recusa CPF com mais de 11 dígitos', () => {
    expect(cpfValido('529982247250')).toBe(false)
  })
  it('mascara enquanto digita', () => {
    expect(mascararCpf('5299822')).toBe('529.982.2')
    expect(mascararCpf('529')).toBe('529')
    expect(mascararCpf('5299')).toBe('529.9')
    expect(mascararCpf('52998224725')).toBe('529.982.247-25')
  })
  it('mascara ignora o que não é dígito e o excesso', () => {
    expect(mascararCpf('529.982.247-25999')).toBe('529.982.247-25')
  })
  it('somenteDigitos tira tudo que não é dígito', () => {
    expect(somenteDigitos(' 529.982-247 25 ')).toBe('52998224725')
  })
})
