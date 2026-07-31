// Cruza os cliques de WhatsApp do site (cms.whatsapp_clicks) com os leads que
// entraram no Exact com origem Whatsapp, por semana. Somente leitura.
//
//   $env:EXACT_SPOTTER_TOKEN="…"
//   pnpm exec tsx --env-file=.env scripts/whatsapp-taxa-de-conversao.ts
//
// POR QUE ISSO EXISTE
//
// A ação de conversão `WhatsApp (servidor) - gclid` no Google Ads foi criada
// de propósito como SECUNDÁRIA (29/07/2026): um clique no botão não é prova de
// conversa, e promovê-la a primária ensinaria o Smart Bidding a comprar
// clique de quem toca no WhatsApp e some. A condição para promover foi
// registrada na época — "com dado de atendimento na mão" — e este script é
// esse dado.
//
// Primeira medição (31/07/2026, 3 dias de rastreio): 16 cliques no site → 1
// lead com origem Whatsapp no CRM. Amostra pequena demais para decidir (com
// n=16, o intervalo de confiança vai de ~0% a ~30%), e enviesada nos dois
// sentidos: o Exact marca "Whatsapp" para conversa vinda de qualquer lugar
// (Google Meu Negócio, Instagram, contato salvo), e conversa que o SDR não
// registra não aparece de jeito nenhum.
//
// COMO DECIDIR, quando houver ~4 semanas de dado:
// - taxa consistentemente ACIMA de ~25%: vale promover a ação a primária —
//   o volume tira as campanhas de LEARNING e o sinal é honesto.
// - taxa ABAIXO disso: manter secundária. Melhor o Ads otimizar por poucos
//   formulários de verdade do que por muitos toques que não viram conversa.
// - em qualquer cenário, se promover: usar Maximizar VALOR de conversão com
//   valor menor para o toque que para o formulário, nunca Maximizar
//   conversões tratando os dois como iguais.

import { Pool } from 'pg'

const BASE = (process.env.EXACT_SPOTTER_BASE_URL || 'https://api.exactspotter.com/v3').replace(
  /\/$/,
  '',
)
const SEMANAS = 6

type LeadExact = { lead: string; registerDate: string; source?: { value?: string } }

/** Segunda-feira da semana de uma data, em ISO curto — chave de agrupamento. */
function semanaDe(data: Date): string {
  const d = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()))
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

async function main() {
  const token = process.env.EXACT_SPOTTER_TOKEN
  if (!token) {
    console.error('Falta EXACT_SPOTTER_TOKEN no ambiente.')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URI,
    ssl: { rejectUnauthorized: false },
    max: 1,
  })

  let cliquesPorSemana: Record<string, { cliques: number; comGclid: number }> = {}
  try {
    const { rows } = await pool.query<{ created_at: Date; gclid: string | null }>(
      `select created_at, gclid from cms.whatsapp_clicks
        where created_at > now() - interval '${SEMANAS} weeks'`,
    )
    cliquesPorSemana = rows.reduce<typeof cliquesPorSemana>((acc, r) => {
      const k = semanaDe(new Date(r.created_at))
      acc[k] ??= { cliques: 0, comGclid: 0 }
      acc[k].cliques += 1
      if (r.gclid) acc[k].comGclid += 1
      return acc
    }, {})
  } finally {
    await pool.end()
  }

  const res = await fetch(`${BASE}/Leads?$top=200&$orderby=registerDate desc`, {
    headers: { token_exact: token, 'content-type': 'application/json' },
  })
  const corpo = (await res.json()) as { value?: LeadExact[] }
  const corte = new Date(Date.now() - SEMANAS * 7 * 864e5)

  const leadsPorSemana = (corpo.value ?? [])
    .filter((l) => /whats/i.test(l.source?.value ?? '') && new Date(l.registerDate) > corte)
    .reduce<Record<string, number>>((acc, l) => {
      const k = semanaDe(new Date(l.registerDate))
      acc[k] = (acc[k] ?? 0) + 1
      return acc
    }, {})

  const semanas = [...new Set([...Object.keys(cliquesPorSemana), ...Object.keys(leadsPorSemana)])]
    .sort()
    .reverse()

  console.log('semana (seg) | cliques no site | com gclid | leads Whatsapp no CRM | taxa')
  for (const s of semanas) {
    const c = cliquesPorSemana[s]?.cliques ?? 0
    const g = cliquesPorSemana[s]?.comGclid ?? 0
    const l = leadsPorSemana[s] ?? 0
    const taxa = c > 0 ? `${Math.round((l / c) * 100)}%` : '—'
    console.log(
      `${s}   | ${String(c).padStart(15)} | ${String(g).padStart(9)} | ${String(l).padStart(21)} | ${taxa.padStart(4)}`,
    )
  }

  const totalCliques = Object.values(cliquesPorSemana).reduce((s, v) => s + v.cliques, 0)
  const totalLeads = Object.values(leadsPorSemana).reduce((s, v) => s + v, 0)
  console.log(
    `\ntotal: ${totalCliques} cliques → ${totalLeads} leads` +
      (totalCliques ? ` (${Math.round((totalLeads / totalCliques) * 100)}%)` : ''),
  )
  console.log(
    'Lembre do viés: o Exact marca "Whatsapp" para conversa de qualquer origem,\n' +
      'e conversa não registrada pelo SDR não aparece aqui.',
  )
}

main().catch((e) => {
  console.error('falhou:', e instanceof Error ? e.message : e)
  process.exit(1)
})
