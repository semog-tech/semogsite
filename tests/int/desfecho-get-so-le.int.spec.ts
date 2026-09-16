import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * **O GET da página de desfecho não pode escrever no banco.** Esta é a razão de
 * a página existir: filtro de segurança corporativo e proxy de e-mail abrem
 * todos os links de uma mensagem para inspecioná-los, e o e-mail tem quatro. Um
 * GET que gravasse marcaria o lead sozinho — e marcaria com o status do último
 * link que o robô abriu, que é "não é lead".
 *
 * Sem trava automática, isso sobrevive só enquanto ninguém refatorar. Um
 * `revalidatePath`, um contador de visualizações, um "marcar como lido" — toda
 * adição plausível à página é uma escrita, e nenhuma delas pareceria errada
 * para quem não conhece a história.
 *
 * A asserção é sobre **ausência de comando de escrita**, e não sobre a
 * quantidade ou a forma dos SELECTs: contar consultas quebraria a cada
 * refatoração boba e ensinaria a equipe a ignorar o teste.
 */

const queryMock = vi.fn()

vi.mock('server-only', () => ({}))

vi.mock('@/lib/db', () => ({
  query: (...args: unknown[]) => queryMock(...args),
}))

/** `notFound()` lança de verdade no Next; aqui lança um sentinela reconhecível. */
const NAO_ENCONTRADO = new Error('NEXT_NOT_FOUND')
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw NAO_ENCONTRADO
  },
}))

const { default: DesfechoPage } = await import('@/app/(interno)/desfecho/[id]/page')
const { assinarLead } = await import('@/lib/desfechoToken')

/**
 * Verbos que mudam estado. `select … for update` não aparece aqui de propósito:
 * ele não grava. Se um dia entrar, é sinal de que a leitura virou parte de uma
 * transação de escrita, e aí o teste deve ser revisto conscientemente.
 */
const ESCRITA = /\b(insert|update|delete|merge|truncate|drop|alter|create|grant|revoke)\b/i

const SEGREDO_ORIGINAL = process.env.LEAD_OUTCOME_SECRET

/** Todo SQL que a página mandou ao banco nesta execução. */
function sqlEmitido(): string[] {
  return queryMock.mock.calls.map(([sql]) => String(sql))
}

/** Abre a página como o navegador abriria, e devolve o que ela consultou. */
async function abrirPagina(id: string, busca: Record<string, string>) {
  try {
    await DesfechoPage({
      params: Promise.resolve({ id }),
      searchParams: Promise.resolve(busca),
    })
    return { encontrou: true, sql: sqlEmitido() }
  } catch (err) {
    if (err !== NAO_ENCONTRADO) throw err
    return { encontrou: false, sql: sqlEmitido() }
  }
}

const LINHA = {
  id: '42',
  created_at: new Date('2026-09-14T12:00:00Z'),
  form: 'proposta',
  data: { nome: 'Joana Teste', cidade: 'Recife e região' },
  desfecho: null,
  desfecho_motivo: null,
  desfecho_observacao: null,
  desfecho_em: null,
  notificado_para: 'ivan@semog.com.br',
}

beforeEach(() => {
  vi.resetAllMocks()
  process.env.LEAD_OUTCOME_SECRET = 'segredo-de-teste-nao-usado-em-producao'
  queryMock.mockResolvedValue({ rows: [LINHA], rowCount: 1 })
})

afterEach(() => {
  if (SEGREDO_ORIGINAL === undefined) delete process.env.LEAD_OUTCOME_SECRET
  else process.env.LEAD_OUTCOME_SECRET = SEGREDO_ORIGINAL
})

describe('GET /desfecho/[id] — só lê', () => {
  it('abrir o link com token válido não emite nenhum comando de escrita', async () => {
    const { encontrou, sql } = await abrirPagina('42', { t: assinarLead('42') as string })

    expect(encontrou).toBe(true)
    // Sem esta linha o teste passaria por construção numa página que não
    // consultasse nada — "nenhuma escrita" só vale se houve acesso ao banco.
    expect(sql.length).toBeGreaterThan(0)
    expect(sql.filter((s) => ESCRITA.test(s))).toEqual([])
  })

  it('nenhum dos quatro links do e-mail escreve — inclusive o de "não é lead"', async () => {
    // É o cenário real do proxy de segurança: ele abre os quatro, em sequência.
    // Se algum gravasse, o lead terminaria marcado com o status do último.
    const token = assinarLead('42') as string
    for (const s of ['negociando', 'fechou', 'nao_evoluiu', 'nao_e_lead']) {
      queryMock.mockClear()
      const { encontrou, sql } = await abrirPagina('42', { t: token, s })

      expect(encontrou).toBe(true)
      expect(sql.length).toBeGreaterThan(0)
      expect(sql.filter((cmd) => ESCRITA.test(cmd))).toEqual([])
    }
  })

  it('lead que JÁ tem desfecho também não é reescrito ao ser aberto', async () => {
    queryMock.mockResolvedValue({
      rows: [
        {
          ...LINHA,
          desfecho: 'fechou',
          desfecho_em: new Date('2026-09-16T17:32:00Z'),
        },
      ],
      rowCount: 1,
    })

    const { sql } = await abrirPagina('42', { t: assinarLead('42') as string, s: 'nao_e_lead' })

    expect(sql.filter((s) => ESCRITA.test(s))).toEqual([])
  })

  it('token inválido não chega nem a consultar', async () => {
    const { encontrou, sql } = await abrirPagina('42', { t: 'token-inventado' })

    expect(encontrou).toBe(false)
    expect(sql).toEqual([])
  })

  it('lead inexistente não vira gravação de nada', async () => {
    queryMock.mockResolvedValue({ rows: [], rowCount: 0 })

    const { encontrou, sql } = await abrirPagina('42', { t: assinarLead('42') as string })

    expect(encontrou).toBe(false)
    expect(sql.filter((s) => ESCRITA.test(s))).toEqual([])
  })
})
