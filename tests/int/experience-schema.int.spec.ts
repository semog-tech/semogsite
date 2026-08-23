import { describe, expect, it } from 'vitest'
import { experienceSchema } from '@/lib/form-schemas'
import { FORMS } from '@/lib/forms'

const valido = {
  nome: 'Maria Souza',
  email: 'maria@exemplo.com.br',
  telefone: '+5583999501388',
  condominio: 'Residencial Cabo Branco',
  acompanhantes: 2,
  aceiteImagem: true,
}

describe('experienceSchema', () => {
  it('aceita uma inscrição completa', () => {
    const r = experienceSchema.safeParse(valido)
    expect(r.success).toBe(true)
  })

  it('aceita sem os campos opcionais', () => {
    const { condominio, acompanhantes, ...minimo } = valido
    const r = experienceSchema.safeParse(minimo)
    expect(r.success).toBe(true)
  })

  it('exige o aceite de uso de imagem', () => {
    const r = experienceSchema.safeParse({ ...valido, aceiteImagem: false })
    expect(r.success).toBe(false)
  })

  it('rejeita e-mail inválido', () => {
    const r = experienceSchema.safeParse({ ...valido, email: 'maria@' })
    expect(r.success).toBe(false)
  })

  it('rejeita telefone que não é número real', () => {
    const r = experienceSchema.safeParse({ ...valido, telefone: '1234' })
    expect(r.success).toBe(false)
  })

  it('trata string vazia de acompanhantes como não informado', () => {
    const r = experienceSchema.safeParse({ ...valido, acompanhantes: '' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.acompanhantes).toBeUndefined()
  })

  it('limita acompanhantes a 3', () => {
    const r = experienceSchema.safeParse({ ...valido, acompanhantes: 4 })
    expect(r.success).toBe(false)
  })

  it('registra o formulário experience com os campos na ordem da tela', () => {
    expect(FORMS.experience.fields).toEqual([
      'nome',
      'email',
      'telefone',
      'condominio',
      'acompanhantes',
      'aceiteImagem',
    ])
  })
})
