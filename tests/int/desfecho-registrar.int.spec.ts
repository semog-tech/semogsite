import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `registrarDesfecho` — a Server Action que grava o desfecho comercial do lead.
 * É o POST da página `/desfecho/<id>`; o clique no botão do e-mail só abre a
 * página (GET que apenas lê).
 *
 * O banco é mockado; o TOKEN é o de verdade (`@/lib/desfechoToken`), porque é
 * justamente a checagem que não pode ser simulada — validar só na renderização
 * da página deixaria a gravação aberta a quem montasse a requisição na mão.
 */

const queryMock = vi.fn()

vi.mock('server-only', () => ({}))

vi.mock('@/lib/db', () => ({
  query: (...args: unknown[]) => queryMock(...args),
}))

const { registrarDesfecho } = await import('@/app/(interno)/_actions/registrar-desfecho')
const { assinarLead } = await import('@/lib/desfechoToken')

const SEGREDO_ORIGINAL = process.env.LEAD_OUTCOME_SECRET

/** Monta o `FormData` que o `<form action={…}>` enviaria. */
function formulario(campos: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [chave, valor] of Object.entries(campos)) fd.set(chave, valor)
  return fd
}

/** O SQL do `update cms.leads` da última chamada ao banco. */
function sqlDoUpdate(): string {
  const chamada = queryMock.mock.calls.at(-1) as [string, unknown[]]
  expect(chamada[0]).toMatch(/update cms\.leads/i)
  return chamada[0]
}

/** Os parâmetros do `update cms.leads` da última chamada ao banco. */
function paramsDoUpdate(): unknown[] {
  const chamada = queryMock.mock.calls.at(-1) as [string, unknown[]]
  expect(chamada[0]).toMatch(/update cms\.leads/i)
  return chamada[1]
}

beforeEach(() => {
  vi.resetAllMocks()
  process.env.LEAD_OUTCOME_SECRET = 'segredo-de-teste-nao-usado-em-producao'
  queryMock.mockResolvedValue({ rows: [], rowCount: 1 })
})

afterEach(() => {
  if (SEGREDO_ORIGINAL === undefined) delete process.env.LEAD_OUTCOME_SECRET
  else process.env.LEAD_OUTCOME_SECRET = SEGREDO_ORIGINAL
})

describe('registrarDesfecho — token', () => {
  it('token válido do próprio lead grava', async () => {
    const resultado = await registrarDesfecho(
      null,
      formulario({ lead: '42', token: assinarLead('42') as string, desfecho: 'fechou' }),
    )

    expect(resultado).toEqual({ ok: true, desfecho: 'fechou', motivo: null })
    expect(queryMock).toHaveBeenCalledTimes(1)
  })

  it('token inválido não grava nada', async () => {
    const resultado = await registrarDesfecho(
      null,
      formulario({ lead: '42', token: 'token-inventado', desfecho: 'fechou' }),
    )

    expect(resultado.ok).toBe(false)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('token de UM lead usado em OUTRO não grava — nem o do outro, nem o próprio', async () => {
    const resultado = await registrarDesfecho(
      null,
      formulario({ lead: '43', token: assinarLead('42') as string, desfecho: 'fechou' }),
    )

    expect(resultado.ok).toBe(false)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('sem token no corpo não grava', async () => {
    const resultado = await registrarDesfecho(null, formulario({ lead: '42', desfecho: 'fechou' }))

    expect(resultado.ok).toBe(false)
    expect(queryMock).not.toHaveBeenCalled()
  })
})

describe('registrarDesfecho — os quatro status', () => {
  it.each([
    ['negociando', null],
    ['fechou', null],
    ['nao_evoluiu', null],
  ] as const)('grava %s', async (desfecho, motivoEsperado) => {
    const resultado = await registrarDesfecho(
      null,
      formulario({ lead: '7', token: assinarLead('7') as string, desfecho }),
    )

    expect(resultado).toEqual({ ok: true, desfecho, motivo: motivoEsperado })
    expect(paramsDoUpdate()).toEqual([desfecho, null, null, '7'])
  })

  it('grava nao_e_lead com o motivo escolhido', async () => {
    const resultado = await registrarDesfecho(
      null,
      formulario({
        lead: '7',
        token: assinarLead('7') as string,
        desfecho: 'nao_e_lead',
        motivo: 'segunda_via_boleto',
      }),
    )

    expect(resultado).toEqual({
      ok: true,
      desfecho: 'nao_e_lead',
      motivo: 'segunda_via_boleto',
    })
    expect(paramsDoUpdate()).toEqual(['nao_e_lead', 'segunda_via_boleto', null, '7'])
  })

  it('status fora da lista canônica não grava', async () => {
    const resultado = await registrarDesfecho(
      null,
      formulario({ lead: '7', token: assinarLead('7') as string, desfecho: 'virou_cliente_top' }),
    )

    expect(resultado.ok).toBe(false)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('sem escolher desfecho não grava', async () => {
    const resultado = await registrarDesfecho(
      null,
      formulario({ lead: '7', token: assinarLead('7') as string }),
    )

    expect(resultado.ok).toBe(false)
    expect(queryMock).not.toHaveBeenCalled()
  })
})

describe('registrarDesfecho — motivo só existe em "não é lead"', () => {
  it('nao_e_lead SEM motivo é recusado, e nada vai pro banco', async () => {
    const resultado = await registrarDesfecho(
      null,
      formulario({ lead: '7', token: assinarLead('7') as string, desfecho: 'nao_e_lead' }),
    )

    expect(resultado.ok).toBe(false)
    expect(resultado.ok === false && resultado.erro).toMatch(/motivo/i)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('nao_e_lead com motivo fora da lista é recusado', async () => {
    const resultado = await registrarDesfecho(
      null,
      formulario({
        lead: '7',
        token: assinarLead('7') as string,
        desfecho: 'nao_e_lead',
        motivo: 'inventado',
      }),
    )

    expect(resultado.ok).toBe(false)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('os outros três status NÃO exigem motivo', async () => {
    for (const desfecho of ['negociando', 'fechou', 'nao_evoluiu'] as const) {
      queryMock.mockClear()
      const resultado = await registrarDesfecho(
        null,
        formulario({ lead: '7', token: assinarLead('7') as string, desfecho }),
      )
      expect(resultado.ok).toBe(true)
    }
  })

  it('motivo e observação enviados junto de "fechou" são descartados', async () => {
    // A tela nem mostra esses campos quando o status não é "não é lead"; quem
    // monta a requisição na mão consegue mandá-los assim mesmo.
    await registrarDesfecho(
      null,
      formulario({
        lead: '7',
        token: assinarLead('7') as string,
        desfecho: 'fechou',
        motivo: 'curriculo',
        observacao: 'texto que não deveria ser gravado',
      }),
    )

    expect(paramsDoUpdate()).toEqual(['fechou', null, null, '7'])
  })

  it('observação em branco vira NULL, não string vazia', async () => {
    await registrarDesfecho(
      null,
      formulario({
        lead: '7',
        token: assinarLead('7') as string,
        desfecho: 'nao_e_lead',
        motivo: 'outro',
        observacao: '   ',
      }),
    )

    expect(paramsDoUpdate()).toEqual(['nao_e_lead', 'outro', null, '7'])
  })

  it('observação longa é cortada no limite', async () => {
    const { LIMITE_OBSERVACAO } = await import('@/lib/desfecho')
    await registrarDesfecho(
      null,
      formulario({
        lead: '7',
        token: assinarLead('7') as string,
        desfecho: 'nao_e_lead',
        motivo: 'outro',
        observacao: 'x'.repeat(LIMITE_OBSERVACAO + 200),
      }),
    )

    expect(String(paramsDoUpdate()[2])).toHaveLength(LIMITE_OBSERVACAO)
  })
})

describe('registrarDesfecho — confirmar duas vezes e corrigir depois', () => {
  it('confirmar duas vezes o mesmo desfecho grava o mesmo estado', async () => {
    const campos = { lead: '7', token: assinarLead('7') as string, desfecho: 'fechou' }

    const primeira = await registrarDesfecho(null, formulario(campos))
    const paramsPrimeira = paramsDoUpdate()
    const segunda = await registrarDesfecho(primeira, formulario(campos))

    expect(primeira).toEqual(segunda)
    expect(paramsDoUpdate()).toEqual(paramsPrimeira)
  })

  it('corrigir um desfecho já registrado sobrescreve — inclusive limpando o motivo', async () => {
    await registrarDesfecho(
      null,
      formulario({
        lead: '7',
        token: assinarLead('7') as string,
        desfecho: 'nao_e_lead',
        motivo: 'curriculo',
        observacao: 'mandou currículo',
      }),
    )
    expect(paramsDoUpdate()).toEqual(['nao_e_lead', 'curriculo', 'mandou currículo', '7'])

    const correcao = await registrarDesfecho(
      null,
      formulario({ lead: '7', token: assinarLead('7') as string, desfecho: 'negociando' }),
    )

    expect(correcao).toEqual({ ok: true, desfecho: 'negociando', motivo: null })
    // Motivo e observação voltam a NULL — senão o lead ficaria "em negociação"
    // carregando o motivo de não ser lead.
    expect(paramsDoUpdate()).toEqual(['negociando', null, null, '7'])

    // E o SQL precisa atribuir as colunas DIRETO do parâmetro. Conferir só os
    // parâmetros não bastava: um `coalesce($2, desfecho_motivo)` no `set`
    // recebe o mesmo `null` e ainda assim preserva o motivo velho — passa por
    // este teste com o dado contraditório no banco. Medido: essa mutação saía
    // verde antes desta asserção existir.
    const sql = sqlDoUpdate()
    expect(sql).toMatch(/desfecho_motivo\s*=\s*\$\d/)
    expect(sql).toMatch(/desfecho_observacao\s*=\s*\$\d/)
  })
})

describe('registrarDesfecho — falhas do banco', () => {
  it('lead que não existe mais devolve erro, não sucesso', async () => {
    queryMock.mockResolvedValue({ rows: [], rowCount: 0 })

    const resultado = await registrarDesfecho(
      null,
      formulario({ lead: '999', token: assinarLead('999') as string, desfecho: 'fechou' }),
    )

    expect(resultado.ok).toBe(false)
  })

  it('erro de banco não lança e a tela diz que não gravou', async () => {
    const erroNoLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    queryMock.mockRejectedValue(new Error('connection refused'))

    const resultado = await registrarDesfecho(
      null,
      formulario({ lead: '7', token: assinarLead('7') as string, desfecho: 'fechou' }),
    )

    expect(resultado.ok).toBe(false)
    expect(erroNoLog).toHaveBeenCalled()
    erroNoLog.mockRestore()
  })
})
