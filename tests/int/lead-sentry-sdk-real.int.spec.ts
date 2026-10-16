// @vitest-environment node
import * as Sentry from '@sentry/nextjs'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

// SDK REAL do Sentry (integração de console incluída), sem rede: `beforeSend` guarda o evento e
// devolve null. Prova que o erro cru com dado pessoal não chega ao evento por nenhum caminho.

vi.mock('server-only', () => ({}))

const { reportarFalhaDoLead } = await import('@/lib/leads/reportar')

const eventos: unknown[] = []

// Os dados pessoais são montados em pedaços: o Sentry anexa ao evento as linhas do código-fonte em
// volta do stack frame (ContextLines), e um literal aqui apareceria no evento por causa do teste.
const juntar = (...pedacos: string[]) => pedacos.join('')
const TELEFONE = juntar('9995', '01388')
const EMAIL = juntar('mar', 'ia@exam', 'ple.com')
const NOME = juntar('Ma', 'ria')
const CONDOMINIO = juntar('Auro', 'ra')
const LINHA = juntar('Failing ', 'row')
const COLUNA = juntar('null ', 'value')

beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  Sentry.init({
    dsn: 'https://chave@o0.ingest.sentry.io/0',
    sendDefaultPii: false,
    beforeSend(evento) {
      eventos.push(evento)
      return null
    },
  })
})

afterAll(async () => {
  await Sentry.close()
  vi.restoreAllMocks()
})

function erroDoPostgres(): Error {
  return Object.assign(new Error(`${COLUNA} in column of +5583${TELEFONE} ${EMAIL}`), {
    code: '23502',
    detail: `${LINHA} contains (501, ${NOME}, +5583${TELEFONE}, ${EMAIL}, ${CONDOMINIO}).`,
  })
}

describe('Sentry real: nenhum campo do evento leva dado pessoal (R8)', () => {
  it('erro com PII no message e no detail, e um evento posterior da mesma requisição', async () => {
    reportarFalhaDoLead('gravacao', erroDoPostgres(), { origem: 'acao', leadId: '501' })
    // Evento posterior: carregaria os breadcrumbs acumulados antes dele.
    Sentry.captureMessage('evento posterior')
    await Sentry.flush(2000)

    expect(eventos.length).toBe(2)
    const tudo = JSON.stringify(eventos)
    for (const pessoal of [TELEFONE, EMAIL, NOME, CONDOMINIO, LINHA, COLUNA]) {
      expect(tudo).not.toContain(pessoal)
    }
    expect(tudo).toContain('501')
    expect(tudo).toContain('23502') // o `code` do pg não é pessoal; fica no breadcrumb sanitizado
  })

  it('controle: com console.error do erro cru, o breadcrumb vazaria (o teste enxerga o problema)', async () => {
    eventos.length = 0
    console.error('[lead] x', erroDoPostgres())
    Sentry.captureMessage('controle')
    await Sentry.flush(2000)
    expect(JSON.stringify(eventos)).toContain(TELEFONE)
  })
})
