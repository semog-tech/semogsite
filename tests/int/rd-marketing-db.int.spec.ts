// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { Pool } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { montarConversaoMarketing } from '@/lib/rdMarketing/payload'

vi.mock('server-only', () => ({}))
vi.mock('next/server', () => ({ after: vi.fn() }))
vi.mock('@sentry/nextjs', () => ({ captureMessage: vi.fn(), flush: async () => true }))
let db: Pool
vi.mock('@/lib/db', () => ({ query: (sql: string, params?: unknown[]) => db.query(sql, params) }))
const { enviarConversaoMarketing, retentarConversoesMarketing } = await import(
  '@/lib/rdMarketing/fila'
)
const connection = process.env.RD_MARKETING_TEST_DATABASE_URL
const fetchMock = vi.fn<typeof fetch>()
const uuid = '43b00843-09af-4fae-bf9d-a0697640b808'
const payload = montarConversaoMarketing(
  'proposta',
  { nome: 'Teste', email: 'teste@example.invalid' },
  { cookies: { get: () => undefined }, atribuicao: null, permitido: true },
)

describe.skipIf(!connection)('fila Marketing — PostgreSQL isolado real', () => {
  it('migração recusa postgres e executa apenas conectado como cms_user', async () => {
    const migration = await readFile('db/2026-11-04-rd-marketing.sql', 'utf8')
    const client = await db.connect()
    try {
      await client.query(
        'drop table cms.leads; create table cms.leads(id bigint primary key, form text, data jsonb)',
      )
      await expect(client.query(migration)).rejects.toThrow(/conectado como cms_user/)
      await client.query('rollback')
      await client.query(
        "do $$ begin if not exists(select from pg_roles where rolname='cms_user') then create role cms_user; end if; end $$; grant usage, create on schema cms to cms_user; alter table cms.leads owner to cms_user",
      )
      await client.query('set role cms_user')
      await client.query(migration)
      const { rows } = await client.query(
        "select column_name from information_schema.columns where table_schema='cms' and table_name='leads' and column_name='rd_marketing_payload'",
      )
      expect(rows).toEqual([{ column_name: 'rd_marketing_payload' }])
    } finally {
      await client.query('rollback; reset role')
      client.release()
    }
  })

  beforeAll(async () => {
    if (!connection) throw new Error('Banco de teste ausente')
    const url = new URL(connection)
    if (
      url.hostname !== '127.0.0.1' ||
      url.port !== '55479' ||
      url.pathname !== '/rd_marketing_test'
    ) {
      throw new Error('Só permite a fixture Docker local desta tarefa')
    }
    db = new Pool({ connectionString: connection, max: 6 })
    // Base sintética local; o teste de ownership acima executa o SQL só nesta fixture.
    await db.query(`create schema if not exists cms;
      create table if not exists cms.leads (
        id bigint primary key, form text not null, data jsonb not null,
        rd_marketing_payload jsonb,
        rd_marketing_status text not null default 'pendente',
        rd_marketing_attempts smallint not null default 0 check(rd_marketing_attempts between 0 and 2),
        rd_marketing_proxima_tentativa_em timestamptz not null default now(),
        rd_marketing_event_uuid text, rd_marketing_error text, rd_marketing_enviado_em timestamptz
      )`)
    vi.stubEnv('RD_MARKETING_API_KEY', 'chave-apenas-teste')
    vi.stubGlobal('fetch', fetchMock)
  })
  beforeEach(async () => {
    await db.query('truncate cms.leads')
    await db.query(
      "insert into cms.leads(id, form, data, rd_marketing_payload) values(1, 'proposta', '{}', $1)",
      [payload],
    )
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(Response.json({ event_uuid: uuid }))
  })
  afterAll(async () => {
    await db?.end()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('corrida real: 12 chamadas concorrentes e outra após confirmação = 1 POST', async () => {
    await Promise.all(Array.from({ length: 12 }, () => enviarConversaoMarketing('1')))
    await enviarConversaoMarketing('1')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const { rows } = await db.query(
      'select rd_marketing_status, rd_marketing_attempts from cms.leads',
    )
    expect(rows).toEqual([{ rd_marketing_status: 'enviado', rd_marketing_attempts: 1 }])
  })

  it('incerto espera 30 min, aceita um retry e bloqueia o terceiro POST', async () => {
    fetchMock.mockRejectedValue(new Error('timeout'))
    await enviarConversaoMarketing('1')
    await retentarConversoesMarketing()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await db.query(
      "update cms.leads set rd_marketing_proxima_tentativa_em = now() - interval '1 second'",
    )
    await retentarConversoesMarketing()
    await db.query(
      "update cms.leads set rd_marketing_proxima_tentativa_em = now() - interval '1 second'",
    )
    await retentarConversoesMarketing()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const { rows } = await db.query(
      'select rd_marketing_status, rd_marketing_attempts from cms.leads',
    )
    expect(rows).toEqual([{ rd_marketing_status: 'esgotado', rd_marketing_attempts: 2 }])
  })

  it('duplicado, evento, atendimento e snapshot ausente são recusados no próprio SQL', async () => {
    await db.query('update cms.leads set data = \'{"duplicaDe":"9"}\'')
    await enviarConversaoMarketing('1')
    await db.query("update cms.leads set form = 'experience', data = '{}'")
    await enviarConversaoMarketing('1')
    await db.query('update cms.leads set form = \'contato\', data = \'{"assunto":"outro"}\'')
    await enviarConversaoMarketing('1')
    await db.query("update cms.leads set form = 'proposta', rd_marketing_payload = null")
    await retentarConversoesMarketing()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('400 não retenta; segundo worker morto se torna esgotado sem POST extra', async () => {
    fetchMock.mockResolvedValue(Response.json({}, { status: 400 }))
    await enviarConversaoMarketing('1')
    await db.query(
      "update cms.leads set rd_marketing_proxima_tentativa_em = now() - interval '1 second'",
    )
    await retentarConversoesMarketing()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await db.query(
      "update cms.leads set rd_marketing_status = 'enviando', rd_marketing_attempts = 2",
    )
    await retentarConversoesMarketing()
    const { rows } = await db.query('select rd_marketing_status from cms.leads')
    expect(rows[0]?.rd_marketing_status).toBe('esgotado')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
