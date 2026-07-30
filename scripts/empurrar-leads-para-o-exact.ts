// Empurra pro Exact leads específicos da `cms.leads`, à mão. Existe pro caso
// que o cron não cobre: lead fora da janela de 48 h (integração ligada depois
// dele chegar, ou falha só descoberta dias depois).
//
// Usa o MESMO `pushLeadToExact` da Server Action e do cron — nada de mapeamento
// paralelo que possa divergir. O `--conditions=react-server` é o que faz o
// `server-only` (guarda de bundle do Next) não lançar fora do Next.
//
//   $env:EXACT_SPOTTER_TOKEN="…"; $env:EXACT_SPOTTER_BASE_URL="https://api.exactspotter.com/v3"
//   pnpm exec tsx --conditions=react-server --env-file=.env scripts/empurrar-leads-para-o-exact.ts 14 15 16
//
// Só age em lead com `exact_lead_id` nulo, então rodar duas vezes não duplica.

import { Pool } from 'pg'
import { pushLeadToExact } from '../src/lib/exact/push-lead.js'

const ids = process.argv.slice(2).filter((a) => /^\d+$/.test(a))

if (ids.length === 0) {
  console.error('Uso: … scripts/empurrar-leads-para-o-exact.ts <id> [id…]  (ids da cms.leads)')
  process.exit(1)
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URI,
    ssl: { rejectUnauthorized: false },
    max: 1,
  })
  try {
    const { rows } = await pool.query<{
      id: string
      form: 'contato' | 'proposta'
      data: Record<string, string>
    }>(
      `select id, form, data from cms.leads
        where id = any($1::bigint[]) and exact_lead_id is null
        order by created_at asc`,
      [ids],
    )
    console.log(`${rows.length} de ${ids.length} ids ainda sem lead no Exact\n`)

    for (const lead of rows) {
      const nome = lead.data.nomeCondominio || lead.data.nome
      const push = await pushLeadToExact(lead.form, lead.data)
      if (!push) {
        console.log(`  ${lead.id} "${nome}" → PULADO (não elegível ou integração desligada)`)
        continue
      }
      await pool.query(
        `update cms.leads
            set exact_lead_id = $1, exact_error = $2, exact_attempts = exact_attempts + 1
          where id = $3`,
        [push.ok ? push.exactLeadId : null, push.ok ? (push.personError ?? null) : push.error, lead.id],
      )
      console.log(
        push.ok
          ? `  ${lead.id} "${nome}" → OK, lead ${push.exactLeadId}${push.personError ? ` (contato falhou: ${push.personError})` : ''}`
          : `  ${lead.id} "${nome}" → FALHOU: ${push.error}`,
      )
    }
  } finally {
    await pool.end()
  }
}

main().catch((e) => {
  console.error('falhou:', e)
  process.exit(1)
})
