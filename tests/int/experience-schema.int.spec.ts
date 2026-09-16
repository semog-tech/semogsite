import { describe, expect, it } from 'vitest'
import { experienceSchema } from '@/lib/form-schemas'
import { FORMS } from '@/lib/forms'

const valido = {
  nome: 'Maria Souza',
  email: 'maria@exemplo.com.br',
  telefone: '+5583999501388',
  condominio: 'Residencial Cabo Branco',
  aceiteImagem: true,
}

describe('experienceSchema', () => {
  it('aceita uma inscrição completa', () => {
    const r = experienceSchema.safeParse(valido)
    expect(r.success).toBe(true)
  })

  it('aceita sem o campo opcional', () => {
    const { condominio, ...minimo } = valido
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

  /**
   * O campo de acompanhantes saiu do formulário em 16/09/2026. O que este
   * teste trava é o contrato do schema, e só ele: `z.object()` sem
   * `.strict()` DESCARTA chave desconhecida no Zod 4, em vez de rejeitar o
   * objeto inteiro. Trocar por `.strict()` mudaria isso em silêncio.
   *
   * O que ele **não** cobre — e já esteve escrito aqui como se cobrisse: a aba
   * que ficou aberta com a versão antiga da página. Essa submissão não chega à
   * validação. O ID da Server Action muda a cada build, e o servidor novo
   * responde 404 ("Server action not found") ao ID antigo; a inscrição em voo
   * se perde no deploy com `.strict()` ou sem ele. Medido nos dois builds
   * desta mudança, não deduzido.
   */
  it('descarta chave desconhecida em vez de rejeitar a inscrição', () => {
    const r = experienceSchema.safeParse({ ...valido, acompanhantes: 2 })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).not.toHaveProperty('acompanhantes')
  })

  it('registra o formulário experience com os campos na ordem da tela', () => {
    expect(FORMS.experience.fields).toEqual([
      'nome',
      'email',
      'telefone',
      'condominio',
      'aceiteImagem',
    ])
  })
})
