/** Integração local: Next compilado + PostgreSQL. Nunca aceita banco/URL remotos. */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import pg from 'pg'

const databaseUrl = new URL(process.env.EXPERIENCE_TEST_DATABASE_URI ?? '')
const siteUrl = new URL(process.env.EXPERIENCE_TEST_SITE_URL ?? 'http://localhost:3187')
for (const url of [databaseUrl, siteUrl]) {
  assert.ok(['localhost', '127.0.0.1'].includes(url.hostname), 'Somente ambiente local.')
}
assert.ok(databaseUrl.pathname.endsWith('_test'), 'Banco deve terminar em _test.')
const client = new pg.Client({
  connectionString: databaseUrl.href,
  ssl: { rejectUnauthorized: false },
})
const manifest = JSON.parse(readFileSync('.next/dev/server/server-reference-manifest.json', 'utf8'))
const action = Object.entries(manifest.node).find(
  ([, item]) => item.exportedName === 'submitForm',
)?.[0]
assert.ok(action, 'Inicie Next dev e abra /experience primeiro.')

async function submeter(email, indice) {
  const response = await fetch(new URL('/experience', siteUrl), {
    method: 'POST',
    headers: {
      'Next-Action': action,
      'Content-Type': 'text/plain;charset=UTF-8',
      Origin: siteUrl.origin,
      'x-forwarded-for': `198.51.100.${indice}`,
    },
    body: JSON.stringify([
      'experience',
      {
        nome: 'Teste Runtime Local',
        email,
        telefone: '+5583999501388',
        aceiteImagem: true,
      },
      'XXXX.DUMMY.TOKEN.XXXX',
    ]),
  })
  assert.equal(response.status, 200)
  return response.text()
}

async function testarConcorrencia() {
  const resultados = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      submeter(`runtime-concorrente-${i}@example.invalid`, 120 + i),
    ),
  )
  const aceitas = resultados.filter((r) => r.includes('"ok":true')).length
  const recusadas = resultados.filter((r) => r.includes('"esgotado":true')).length
  assert.equal(aceitas, 1)
  assert.equal(recusadas, 9)
  assert.ok((await submeter('runtime-1@example.invalid', 145)).includes('"ok":true'))
  const { rows } = await client.query('select * from cms.experience_lotacao()')
  assert.equal(rows[0].pessoas, 150)
  console.log(
    JSON.stringify({
      concorrentes: 10,
      aceitas,
      recusadas,
      reenvioAceito: true,
      pessoas: rows[0].pessoas,
    }),
  )
}

async function testarFalha() {
  await client.query('revoke execute on function cms.experience_lotacao(jsonb) from cms_user')
  const result = await submeter('runtime-falha@example.invalid', 199)
  assert.ok(result.includes('"ok":false'))
  assert.ok(!result.includes('"esgotado":true'))
  const { rows } = await client.query('select count(*)::int total from cms.leads')
  assert.equal(rows[0].total, 151)
  console.log(JSON.stringify({ falhaConsultaRecusada: true, linhas: rows[0].total }))
}

await client.connect()
let fixtureCriada = false
try {
  const { rows } = await client.query('select count(*)::int total from cms.leads')
  assert.equal(rows[0].total, 0, 'Fixture deve estar vazia; nada será apagado automaticamente.')
  await client.query(`insert into cms.leads(form,data)
    select 'experience', jsonb_build_object('nome','Teste local','email','runtime-'||n||'@example.invalid','acompanhantes',0)
    from generate_series(1,149)n`)
  fixtureCriada = true
  await testarConcorrencia()
  await testarFalha()
} finally {
  if (fixtureCriada) {
    await client.query('grant execute on function cms.experience_lotacao(jsonb) to cms_user')
    await client.query(
      "delete from cms.leads where form='experience' and data->>'email' like 'runtime-%@example.invalid'",
    )
  }
  await client.end()
}
