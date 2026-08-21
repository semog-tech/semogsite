import { describe, expect, it } from 'vitest'
import { isExactEligible } from '@/lib/exact/map-lead'

describe('isExactEligible', () => {
  it('nunca envia inscrição do Experience ao CRM', () => {
    expect(isExactEligible('experience', { nome: 'Maria', email: 'm@e.com' })).toBe(false)
  })

  it('não envia nem quando o payload traz o assunto comercial', () => {
    // Blindagem: hoje o ramo final olha `data.assunto`. Sem a guarda explícita,
    // um campo com esse nome faria uma inscrição de evento virar lead comercial.
    expect(isExactEligible('experience', { assunto: 'proposta-comercial' })).toBe(false)
  })

  it('continua enviando proposta', () => {
    expect(isExactEligible('proposta', {})).toBe(true)
  })

  it('continua enviando contato com assunto comercial', () => {
    expect(isExactEligible('contato', { assunto: 'proposta-comercial' })).toBe(true)
  })

  it('não envia contato de outro assunto', () => {
    expect(isExactEligible('contato', { assunto: 'duvida' })).toBe(false)
  })
})
