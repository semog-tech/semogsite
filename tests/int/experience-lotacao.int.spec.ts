import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const lotacao = {
  evento_id: '65e40d0c-890c-490e-8c7b-b31f45adf6f8',
  capacidade: 150,
  inscritos: 90,
  acompanhantes: 30,
  pessoas: 120,
}

/**
 * A trava de lotação da inscrição do Experience — a única que de fato impede a
 * vaga 151, porque a página é servida com ISR e pode estar até um minuto
 * atrasada em relação ao banco.
 *
 * **Estes testes existem por causa de um defeito real, não teórico.** A
 * primeira versão era `insert ... select ... where (select count(*)) < $7` numa
 * declaração única, na crença de que um comando só não poderia ter corrida. Uma
 * medição em Postgres 17 (`read committed`), partindo de 149 com limite 150,
 * derrubou isso: dez envios simultâneos gravaram os dez (159 no total); com 30
 * de concorrência, 179. O subselect roda no snapshot da declaração e não toma
 * lock — a declaração única economiza uma ida ao banco, não serializa nada.
 *
 * Como o mecanismo certo é invisível no resultado (o retorno é igual nos dois
 * casos), **estes testes olham o SQL**. É a única forma de um teste automático
 * separar a versão que trava da que só parece travar.
 *
 * `server-only` precisa ser neutralizado: a suíte roda em jsdom.
 */

const queryMock = vi.fn()
const releaseMock = vi.fn()
const connectMock = vi.fn()
const sendMailMock = vi.fn()
const verifyTurnstileMock = vi.fn()
const headersMock = vi.fn()
const cookiesMock = vi.fn()

vi.mock('server-only', () => ({}))
vi.mock('@/lib/db', () => ({
  query: (...args: unknown[]) => queryMock(...args),
  pool: { connect: (...args: unknown[]) => connectMock(...args) },
}))
vi.mock('@/lib/sendgrid', () => ({ sendMail: (...args: unknown[]) => sendMailMock(...args) }))
vi.mock('@/lib/turnstile', () => ({
  verifyTurnstile: (...args: unknown[]) => verifyTurnstileMock(...args),
}))
vi.mock('@/lib/exact/push-lead', () => ({ pushLeadToExact: async () => null }))
// `rateLimit` guarda estado em módulo, por `formulário:IP`. Sem o dublê, o
// SEXTO envio deste arquivo (são vários, todos 'experience' do mesmo IP) seria
// barrado pela cota de 5/min e o teste falharia por um motivo que não tem nada
// a ver com lotação.
vi.mock('@/lib/rate-limit', () => ({ rateLimit: () => ({ ok: true }) }))
vi.mock('next/headers', () => ({
  headers: (...args: unknown[]) => headersMock(...args),
  cookies: (...args: unknown[]) => cookiesMock(...args),
}))

const { submitForm } = await import('@/app/(frontend)/_actions/submit-form')

const inscricao = {
  nome: 'Maria Souza',
  email: 'maria@exemplo.com.br',
  telefone: '+5583999501388',
  condominio: 'Residencial Cabo Branco',
  aceiteImagem: true,
}

const contato = {
  nome: 'João Lima',
  email: 'joao@exemplo.com.br',
  telefone: '+5581999501388',
  assunto: 'duvida-geral',
  mensagem: 'Gostaria de saber mais sobre a administração de condomínios.',
}

/** Todo SQL que passou pelo banco nesta submissão, normalizado. */
function sqlsExecutados(): string[] {
  return queryMock.mock.calls.map(([sql]) => String(sql).replace(/\s+/g, ' ').trim())
}

function sqlDoInsert(): string {
  const encontrado = sqlsExecutados().find((sql) => /^insert into cms\.leads/i.test(sql))
  if (!encontrado) throw new Error('nenhum INSERT em cms.leads foi executado')
  return encontrado
}

/**
 * Client de teste: delega ao mesmo `queryMock`, para as asserções verem uma
 * lista só de SQL. É um `EventEmitter` de verdade porque o código registra um
 * listener de `'error'` no client enquanto a transação corre — um objeto
 * literal sem `on`/`removeListener` quebraria por ausência de método, e não
 * pelo que o teste quer medir.
 */
function clientFalso() {
  return Object.assign(new EventEmitter(), {
    query: (...args: unknown[]) => queryMock(...args),
    release: releaseMock,
  })
}

describe('trava de lotação do Experience', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    connectMock.mockResolvedValue(clientFalso())
    queryMock.mockImplementation(async (sql: string) =>
      /experience_lotacao/.test(sql)
        ? { rows: [lotacao], rowCount: 1 }
        : { rows: [{ id: '77' }], rowCount: 1 },
    )
    sendMailMock.mockResolvedValue({ ok: true })
    verifyTurnstileMock.mockResolvedValue(true)
    cookiesMock.mockResolvedValue({ get: () => undefined })
    headersMock.mockResolvedValue({
      get: (name: string) => (name === 'x-forwarded-for' ? '198.51.100.7' : null),
    })
  })

  /**
   * O coração da correção. Sem o `pg_advisory_xact_lock` DENTRO de uma
   * transação explícita, a contagem é lida de um snapshot que ignora quem está
   * gravando ao mesmo tempo — medido, com excesso em todas as rodadas.
   */
  it('serializa a inscrição com advisory lock dentro de uma transação', async () => {
    await submitForm('experience', inscricao, 'test-token')

    const sqls = sqlsExecutados()
    const iBegin = sqls.findIndex((s) => /^begin$/i.test(s))
    const iTimeout = sqls.findIndex((s) => /lock_timeout/i.test(s))
    const iLock = sqls.findIndex((s) => /pg_advisory_xact_lock/i.test(s))
    const iInsert = sqls.findIndex((s) => /^insert into cms\.leads/i.test(s))
    const iCommit = sqls.findIndex((s) => /^commit$/i.test(s))

    expect(iBegin).toBeGreaterThanOrEqual(0)
    expect(iTimeout).toBeGreaterThanOrEqual(0)
    expect(iLock).toBeGreaterThanOrEqual(0)
    expect(iInsert).toBeGreaterThanOrEqual(0)
    expect(iCommit).toBeGreaterThanOrEqual(0)

    // A ORDEM é o que faz o mecanismo funcionar, e cada elo já falhou de
    // verdade quando foi mexido:
    //
    // - `lock_timeout` DEPOIS do lock não limita a espera que existe para
    //   limitar — mutado assim, a submissão pendura (>15s medidos) e, sem esta
    //   asserção de ordem, os testes continuavam TODOS verdes;
    // - advisory lock numa CTE do próprio INSERT (em vez de comando anterior,
    //   dentro da transação) falhou em 10 de 10 rodadas, porque o snapshot do
    //   comando é tirado antes de o lock chegar.
    //
    // Conferir só que os SQLs existem não pega nenhum dos dois.
    expect(iBegin).toBeLessThan(iTimeout)
    expect(iTimeout).toBeLessThan(iLock)
    expect(iLock).toBeLessThan(iInsert)
    expect(iInsert).toBeLessThan(iCommit)
  })

  it('abre a transação num client dedicado e o devolve ao pool', async () => {
    await submitForm('experience', inscricao, 'test-token')

    expect(connectMock).toHaveBeenCalledTimes(1)
    // Vazar um client por submissão esgota o pool (`max: 5`) e derruba o site.
    expect(releaseMock).toHaveBeenCalledTimes(1)
  })

  /**
   * O client sai do pool SEM o listener de `'error'` — `pool.connect()` remove
   * o do pool e só o recoloca no `release`. Nesse intervalo, um erro assíncrono
   * na conexão (backend morto, rede caindo) emite `'error'` num `EventEmitter`
   * sem ouvinte, e no Node isso é `uncaughtException`: não passa pelo
   * `try/catch`, não vira promise rejeitada, derruba o processo.
   *
   * O teste reproduz o mecanismo exato — um `EventEmitter` de verdade, um
   * `emit('error')` de verdade no meio da transação. Sem o listener, o próprio
   * `emit` lança aqui dentro e o teste fica vermelho.
   */
  it('escuta os erros da conexão enquanto ela está em nossas mãos', async () => {
    const emissor = new EventEmitter()
    let ouvintesDuranteOInsert = -1

    connectMock.mockResolvedValue(
      Object.assign(emissor, {
        query: vi.fn(async (sql: string) => {
          if (/^\s*insert into cms\.leads/i.test(String(sql))) {
            ouvintesDuranteOInsert = emissor.listenerCount('error')
            // Sem listener registrado, este emit LANÇA — é o uncaughtException.
            emissor.emit('error', new Error('Connection terminated unexpectedly'))
          }
          return /experience_lotacao/.test(sql)
            ? { rows: [lotacao], rowCount: 1 }
            : { rows: [{ id: '77' }], rowCount: 1 }
        }),
        release: releaseMock,
      }),
    )

    await submitForm('experience', inscricao, 'test-token')

    expect(ouvintesDuranteOInsert).toBeGreaterThan(0)
    // E devolvido sem o nosso ouvinte: a partir do `release` o pool volta a ser
    // dono do client, e um listener por submissão vazaria numa conexão que vive
    // enquanto a instância viver (`MaxListenersExceededWarning`).
    expect(emissor.listenerCount('error')).toBe(0)
  })

  it('limita a espera pelo lock, para a submissão não pendurar', async () => {
    await submitForm('experience', inscricao, 'test-token')
    expect(sqlsExecutados().some((s) => /lock_timeout/i.test(s))).toBe(true)
  })

  it('consulta a ocupação projetada depois do lock e antes de gravar', async () => {
    const result = await submitForm('experience', inscricao, 'test-token')
    expect(result.ok).toBe(true)
    const sqls = sqlsExecutados()
    const consulta = sqls.findIndex((s) => /experience_lotacao/.test(s))
    expect(consulta).toBeGreaterThan(sqls.findIndex((s) => /pg_advisory_xact_lock/.test(s)))
    expect(consulta).toBeLessThan(sqls.findIndex((s) => /^insert/.test(s)))
    expect(sqlDoInsert()).not.toMatch(/count|where/i)
  })

  it('recusa ocupação acima da capacidade do banco, sem INSERT', async () => {
    queryMock.mockImplementation(async (sql: string) =>
      /experience_lotacao/.test(sql)
        ? { rows: [{ ...lotacao, capacidade: 73, inscritos: 44, pessoas: 74 }], rowCount: 1 }
        : { rows: [], rowCount: 0 },
    )
    const result = await submitForm('experience', inscricao, 'test-token')
    expect(result.ok).toBe(false)
    expect(result.esgotado).toBe(true)
    expect(result.message).toMatch(/não foi registrada/i)
    expect(sqlsExecutados().some((s) => /^insert/.test(s))).toBe(false)
  })

  it('aceita a última vaga e reenvio cuja projeção continua exatamente na capacidade', async () => {
    queryMock.mockImplementation(async (sql: string) =>
      /experience_lotacao/.test(sql)
        ? { rows: [{ ...lotacao, capacidade: 73, inscritos: 43, pessoas: 73 }], rowCount: 1 }
        : { rows: [{ id: '77' }], rowCount: 1 },
    )
    expect((await submitForm('experience', inscricao, 'test-token')).ok).toBe(true)
  })

  it('falha fechada quando a função não devolve lotação válida', async () => {
    queryMock.mockResolvedValue({ rows: [], rowCount: 0 })
    const result = await submitForm('experience', inscricao, 'test-token')
    expect(result.ok).toBe(false)
    expect(result.esgotado).toBeUndefined()
    expect(sqlsExecutados().some((s) => /^insert/.test(s))).toBe(false)
    expect(sqlsExecutados()).toContain('rollback')
    expect(sendMailMock).not.toHaveBeenCalled()
  })

  /**
   * O pior desfecho possível desta funcionalidade: a pessoa é recusada e ainda
   * recebe "Inscrição recebida" no e-mail. Acorda cedo no sábado, atravessa
   * João Pessoa e não está na lista.
   */
  it('não envia e-mail nenhum quando recusa por lotação', async () => {
    queryMock.mockResolvedValue({
      rows: [{ ...lotacao, inscritos: 121, pessoas: 151 }],
      rowCount: 1,
    })

    await submitForm('experience', inscricao, 'test-token')

    expect(sendMailMock).not.toHaveBeenCalled()
    expect(sqlsExecutados().some((s) => /^update cms\.leads/i.test(s))).toBe(false)
  })

  it('deixa entrar normalmente enquanto a condição aprova', async () => {
    const result = await submitForm('experience', inscricao, 'test-token')

    expect(result.ok).toBe(true)
    expect(result.esgotado).toBeUndefined()
    expect(sendMailMock).toHaveBeenCalled()
  })
})

describe('falha no meio da transação', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    connectMock.mockResolvedValue(clientFalso())
    sendMailMock.mockResolvedValue({ ok: true })
    verifyTurnstileMock.mockResolvedValue(true)
    cookiesMock.mockResolvedValue({ get: () => undefined })
    headersMock.mockResolvedValue({ get: () => null })
  })

  /**
   * Um INSERT que estoura não pode deixar a transação aberta (ela seguraria o
   * advisory lock e enfileiraria todo mundo atrás) nem o client fora do pool.
   * E, do lado de quem enviou, não pode virar falso sucesso.
   */
  it('faz rollback, devolve o client e NÃO reporta sucesso', async () => {
    queryMock.mockImplementation(async (sql: string) => {
      if (/^\s*insert into cms\.leads/i.test(sql)) throw new Error('boom no insert')
      return /experience_lotacao/.test(sql)
        ? { rows: [lotacao], rowCount: 1 }
        : { rows: [], rowCount: 0 }
    })

    const result = await submitForm('experience', inscricao, 'test-token')

    expect(sqlsExecutados().some((s) => /^rollback$/i.test(s))).toBe(true)
    expect(releaseMock).toHaveBeenCalledTimes(1)
    expect(result.ok).toBe(false)
    // Erro de banco NÃO é lotação: dizer "as vagas acabaram" aqui mandaria
    // embora alguém que ainda tinha vaga.
    expect(result.esgotado).toBeUndefined()
    expect(result.message).toBeTruthy()
  })
})

describe('os outros formulários não ganharam limite', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    connectMock.mockResolvedValue(clientFalso())
    queryMock.mockImplementation(async (sql: string) =>
      /experience_lotacao/.test(sql)
        ? { rows: [lotacao], rowCount: 1 }
        : { rows: [{ id: '77' }], rowCount: 1 },
    )
    sendMailMock.mockResolvedValue({ ok: true })
    verifyTurnstileMock.mockResolvedValue(true)
    cookiesMock.mockResolvedValue({ get: () => undefined })
    headersMock.mockResolvedValue({ get: () => null })
  })

  /**
   * O advisory lock é global no banco: se Contato e Proposta passassem pela
   * mesma trava, toda submissão do site entraria numa fila única por causa de
   * um limite que só o evento tem.
   */
  it('Contato não abre transação nem toma o lock de vagas', async () => {
    const result = await submitForm('contato', contato, 'test-token')

    expect(result.ok).toBe(true)
    expect(connectMock).not.toHaveBeenCalled()

    const sqls = sqlsExecutados()
    expect(sqls.some((s) => /pg_advisory_xact_lock/i.test(s))).toBe(false)
    expect(sqls.some((s) => /^begin$/i.test(s))).toBe(false)
    expect(sqlDoInsert()).toContain('values ($1, $2, $3, $4, $5, $6)')
    expect(sqlDoInsert()).not.toMatch(/count\(\*\)/i)
  })

  /**
   * O modo de falha que um `rowCount` lido sem olhar o formulário criaria: um
   * `values` que devolva 0 por qualquer motivo transformaria Contato e Proposta
   * em "esgotado" — formulários sem limite nenhum passando a recusar gente.
   */
  it('Contato nunca é recusado por lotação, mesmo sem rowCount', async () => {
    queryMock.mockResolvedValue({ rows: [{ id: '77' }], rowCount: 0 })

    const result = await submitForm('contato', contato, 'test-token')

    expect(result.ok).toBe(true)
    expect(result.esgotado).toBeUndefined()
  })
})
