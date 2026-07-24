import { describe, expect, it } from 'vitest'
import { extractLeadColumns, FORMS, GCLID_FIELD } from '@/lib/forms'

// Testes puros (sem DB) — só a config estática dos formulários e a extração
// das colunas `gclid`/`email` a partir do `data` (jsonb) de um lead. O pg
// real (`src/lib/db.ts`) é exercitado só pelos testes de fumaça das outras
// tasks (submit-form/cron), nunca aqui.
describe('definições de formulário', () => {
  it('tem contato e proposta, cada um com sua lista de campos', () => {
    expect(FORMS.contato).toBeDefined()
    expect(FORMS.contato.fields).toEqual(
      expect.arrayContaining(['nome', 'email', 'telefone', 'assunto', 'mensagem']),
    )
    expect(FORMS.proposta).toBeDefined()
    expect(FORMS.proposta.fields).toEqual(
      expect.arrayContaining([
        'nome',
        'email',
        'telefone',
        'cargo',
        'cidade',
        'nomeCondominio',
        'tipo',
        'unidades',
      ]),
    )
  })

  it('extrai gclid e email das colunas do lead (chaves literais do submissionData)', () => {
    const { gclid, email } = extractLeadColumns({
      nome: 'Fulano',
      email: 'a@b.com',
      [GCLID_FIELD]: 'ABC123',
    })
    expect(email).toBe('a@b.com')
    expect(gclid).toBe('ABC123')
  })

  it('não quebra sem gclid/email (campos ausentes viram undefined)', () => {
    const r = extractLeadColumns({ nome: 'x' })
    expect(r.gclid).toBeUndefined()
    expect(r.email).toBeUndefined()
  })

  it('trata string vazia como ausente (não deixa "" virar coluna gravada)', () => {
    const r = extractLeadColumns({ email: '', [GCLID_FIELD]: '' })
    expect(r.email).toBeUndefined()
    expect(r.gclid).toBeUndefined()
  })

  it('GCLID_FIELD é o rótulo exato usado pela atribuição (origem — gclid (Google Ads))', () => {
    expect(GCLID_FIELD).toBe('origem — gclid (Google Ads)')
  })
})
