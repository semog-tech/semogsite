import { describe, expect, it } from 'vitest'
import { ambienteAtual, ambienteLiberaEnvio, SQL_AMBIENTE_LIBERADO } from '@/lib/leads/ambiente'
import { destinatariosPorUf } from '@/lib/leads/destinatarios'

const TRES = ['ivan@semog.com.br', 'galvao@semog.com.br', 'comercial.pb@semog.com.br']

describe('roteamento do e-mail interno pela UF (spec 4.3, R3)', () => {
  it.each([
    ['PE', ['ivan@semog.com.br']],
    ['PB', ['comercial.pb@semog.com.br']],
    ['PA', ['galvao@semog.com.br']],
    ['SP', TRES],
    ['', TRES],
    [undefined, TRES],
    ['constructor', TRES],
    ['__proto__', TRES],
  ])('%s → %o', (uf, destino) => expect(destinatariosPorUf(uf)).toEqual(destino))
})

describe('ambiente (R1)', () => {
  it('lê VERCEL_ENV e cai em local fora da Vercel', () => {
    expect(ambienteAtual({ VERCEL_ENV: 'production' })).toBe('production')
    expect(ambienteAtual({ VERCEL_ENV: 'preview' })).toBe('preview')
    expect(ambienteAtual({})).toBe('local')
  })

  it('na Vercel sem VERCEL_ENV vale produção: falha para o lado de enviar, não de calar', () => {
    expect(ambienteAtual({ VERCEL: '1' })).toBe('production')
    expect(ambienteAtual({ VERCEL: '' })).toBe('local')
    expect(ambienteAtual({ VERCEL_ENV: 'preview', VERCEL: '1' })).toBe('preview')
    expect(ambienteAtual({ VERCEL_ENV: 'development', VERCEL: '1' })).toBe('development')
  })

  it('só produção ou linha antiga (sem a chave) libera envio', () => {
    expect(ambienteLiberaEnvio({})).toBe(true)
    expect(ambienteLiberaEnvio({ ambiente: 'production' })).toBe(true)
    expect(ambienteLiberaEnvio({ ambiente: 'preview' })).toBe(false)
    expect(ambienteLiberaEnvio({ ambiente: 'local' })).toBe(false)
    expect(ambienteLiberaEnvio({ ambiente: 'development' })).toBe(false)
  })

  it('o SQL espelha a mesma regra', () => {
    expect(SQL_AMBIENTE_LIBERADO).toBe("coalesce(data->>'ambiente', 'production') = 'production'")
  })
})
