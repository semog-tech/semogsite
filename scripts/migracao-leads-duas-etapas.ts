// Migração de `cms.leads` para o formulário em duas etapas (db/leads-duas-etapas.sql).
//
//   pnpm exec tsx --env-file=<.env fora do repo> scripts/migracao-leads-duas-etapas.ts ler
//   pnpm exec tsx --env-file=<.env fora do repo> scripts/migracao-leads-duas-etapas.ts aplicar --confirmo
//   pnpm exec tsx --env-file=<.env fora do repo> scripts/migracao-leads-duas-etapas.ts conferir
//
// `ler` só lê, dentro de uma transação `read only` (information_schema, pg_tables, pg_constraint,
// pg_trigger, pg_rules, pg_locks). `aplicar` exige --confirmo e só roda depois do "ok" explícito
// do Leandro. `conferir` grava de verdade DENTRO de uma transação que sempre termina em ROLLBACK
// (consome números da sequência de `id`, nada mais). Nunca imprime a connection string.

import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { Pool, type PoolClient } from 'pg'

const COLUNAS_NOVAS = ['etapa', 'token_envio', 'envio_em', 'exact_tentativa_em'] as const
const MARCA = 'conferencia-migracao-duas-etapas'

function criarPool(): Pool {
  if (!process.env.DATABASE_URI) throw new Error('DATABASE_URI ausente: passe --env-file.')
  return new Pool({
    connectionString: process.env.DATABASE_URI,
    ssl: { rejectUnauthorized: false },
    max: 1,
  })
}

function afirmar(ok: boolean, o_que: string): void {
  console.log(`${ok ? 'OK    ' : 'FALHOU'}  ${o_que}`)
  if (!ok) process.exitCode = 1
}

async function lerEstrutura(cliente: PoolClient): Promise<void> {
  const quem = await cliente.query<{ usuario: string }>('select current_user as usuario')
  const dono = await cliente.query<{ tableowner: string }>(
    "select tableowner from pg_tables where schemaname = 'cms' and tablename = 'leads'",
  )
  const colunas = await cliente.query<{
    column_name: string
    data_type: string
    is_nullable: string
    column_default: string | null
  }>(
    `select column_name, data_type, is_nullable, column_default
       from information_schema.columns
      where table_schema = 'cms' and table_name = 'leads'
      order by ordinal_position`,
  )
  const restricoes = await cliente.query<{ conname: string; definicao: string }>(
    `select conname, pg_get_constraintdef(oid) as definicao
       from pg_constraint where conrelid = 'cms.leads'::regclass order by conname`,
  )
  console.log(`conectado como: ${quem.rows[0]?.usuario}`)
  console.log(`dono de cms.leads: ${dono.rows[0]?.tableowner ?? '(tabela não encontrada)'}`)
  console.table(colunas.rows)
  console.table(restricoes.rows)
  const faltam = COLUNAS_NOVAS.filter((c) => !colunas.rows.some((r) => r.column_name === c))
  console.log(
    faltam.length ? `colunas novas ausentes: ${faltam.join(', ')}` : 'as 4 colunas novas existem',
  )
}

// Triggers e regras importam porque `conferir` faz INSERT real: um efeito externo (pg_net, notify,
// webhook) dispararia antes do ROLLBACK. Contagem e locks dimensionam o ALTER.
async function lerEfeitosEPorte(cliente: PoolClient): Promise<void> {
  const gatilhos = await cliente.query<{ tgname: string; definicao: string }>(
    `select tgname, pg_get_triggerdef(oid) as definicao from pg_trigger
      where tgrelid = 'cms.leads'::regclass and not tgisinternal`,
  )
  const regras = await cliente.query<{ rulename: string; definition: string }>(
    "select rulename, definition from pg_rules where schemaname = 'cms' and tablename = 'leads'",
  )
  const linhas = await cliente.query<{ n: number }>('select count(*)::int as n from cms.leads')
  const locks = await cliente.query<{ pid: number; mode: string; granted: boolean }>(
    `select l.pid, l.mode, l.granted from pg_locks l join pg_class c on c.oid = l.relation
      where c.oid = 'cms.leads'::regclass and l.pid <> pg_backend_pid()`,
  )
  console.log(`triggers de cms.leads: ${gatilhos.rows.length}`)
  if (gatilhos.rows.length) console.table(gatilhos.rows)
  console.log(`regras de cms.leads: ${regras.rows.length}`)
  if (regras.rows.length) console.table(regras.rows)
  console.log(`linhas em cms.leads: ${linhas.rows[0]?.n}`)
  console.log(`locks de outras sessões em cms.leads: ${locks.rows.length}`)
  if (locks.rows.length) console.table(locks.rows)
}

async function ler(pool: Pool): Promise<void> {
  const cliente = await pool.connect()
  try {
    await cliente.query('begin read only')
    await lerEstrutura(cliente)
    await lerEfeitosEPorte(cliente)
  } finally {
    await cliente.query('rollback')
    cliente.release()
  }
}

async function aplicar(pool: Pool): Promise<void> {
  if (!process.argv.includes('--confirmo')) {
    throw new Error('aplicar exige --confirmo (só depois do ok do Leandro, Tarefa 2.1 Step 5).')
  }
  const sql = readFileSync(path.join(process.cwd(), 'db', 'leads-duas-etapas.sql'), 'utf8')
  const cliente = await pool.connect()
  try {
    await cliente.query('begin')
    await cliente.query("set local lock_timeout = '5s'")
    await cliente.query(sql)
    await cliente.query('commit')
    console.log('db/leads-duas-etapas.sql aplicado.')
  } catch (erro) {
    await cliente.query('rollback')
    throw erro
  } finally {
    cliente.release()
  }
}

/** Código SQLSTATE do erro do comando, dentro de um savepoint (a transação segue viva). */
async function codigoDoErro(cliente: PoolClient, sql: string, params: unknown[]): Promise<string> {
  await cliente.query('savepoint tentativa')
  try {
    await cliente.query(sql, params)
    return 'sem erro'
  } catch (erro) {
    // `as`: o erro do pg é um Error com `code` (SQLSTATE); sem ele, devolvemos o texto.
    return (erro as { code?: string }).code ?? String(erro)
  } finally {
    await cliente.query('rollback to savepoint tentativa')
  }
}

const UPDATE_ETAPA_2 = `update cms.leads set data = data || $2::jsonb, etapa = 2, envio_em = now()
  where token_envio = $1 and etapa = 1 and envio_em is null
    and created_at > now() - interval '30 minutes' returning id`

async function conferirEmTransacao(cliente: PoolClient): Promise<void> {
  const token = randomUUID()
  const etapa1 = await cliente.query<{ etapa: number; envio_em: Date | null }>(
    `insert into cms.leads (form, data, etapa, token_envio, envio_em)
     values ('proposta', $1, 1, $2, null) returning etapa, envio_em`,
    [{ variante: 'duas-etapas', ambiente: MARCA }, token],
  )
  afirmar(
    etapa1.rows[0]?.etapa === 1 && etapa1.rows[0].envio_em === null,
    'INSERT da etapa 1 com envio_em nulo',
  )
  const antigo = await cliente.query<{ etapa: number | null; envio_em: Date | null }>(
    "insert into cms.leads (form, data) values ('proposta', $1) returning etapa, envio_em",
    [{ ambiente: MARCA }],
  )
  afirmar(
    antigo.rows[0]?.etapa === null && antigo.rows[0].envio_em instanceof Date,
    'INSERT do formulário antigo (sem as colunas novas) nasce com etapa nula e envio_em preenchido',
  )
  const etapa2 = await cliente.query(UPDATE_ETAPA_2, [token, { nome: 'Conferência' }])
  afirmar(etapa2.rowCount === 1, 'UPDATE da etapa 2 acha a linha pelo token')
  const repetido = await cliente.query(UPDATE_ETAPA_2, [token, { nome: 'Repetido' }])
  afirmar(repetido.rowCount === 0, 'o mesmo token não serve duas vezes (uso único)')
  const invalida = await codigoDoErro(
    cliente,
    "insert into cms.leads (form, data, etapa) values ('proposta', '{}'::jsonb, 3)",
    [],
  )
  afirmar(invalida === '23514', `CHECK recusa etapa = 3 (SQLSTATE ${invalida})`)
  const duplicado = await codigoDoErro(
    cliente,
    "insert into cms.leads (form, data, token_envio) values ('proposta', '{}'::jsonb, $1)",
    [token],
  )
  afirmar(duplicado === '23505', `UNIQUE recusa token_envio repetido (SQLSTATE ${duplicado})`)
}

async function conferir(pool: Pool): Promise<void> {
  await ler(pool)
  const cliente = await pool.connect()
  try {
    await cliente.query('begin')
    await conferirEmTransacao(cliente)
  } finally {
    await cliente.query('rollback')
    cliente.release()
  }
  const sobrou = await pool.query<{ n: number }>(
    "select count(*)::int as n from cms.leads where data->>'ambiente' = $1",
    [MARCA],
  )
  afirmar(sobrou.rows[0]?.n === 0, 'nada da conferência ficou gravado (ROLLBACK)')
}

async function main(): Promise<void> {
  const acoes = { ler, aplicar, conferir } as const
  const nome = process.argv[2]
  if (nome !== 'ler' && nome !== 'aplicar' && nome !== 'conferir') {
    throw new Error('Uso: … migracao-leads-duas-etapas.ts ler | aplicar --confirmo | conferir')
  }
  const pool = criarPool()
  try {
    await acoes[nome](pool)
  } finally {
    await pool.end()
  }
}

main().catch((erro: unknown) => {
  console.error(erro instanceof Error ? erro.message : erro)
  process.exitCode = 1
})
