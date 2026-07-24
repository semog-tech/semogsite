import 'server-only'

import { Pool, type QueryResultRow } from 'pg'

/**
 * Pool `pg` sobre o `DATABASE_URI` (mesmo Postgres do Supabase que o Payload
 * usa via `postgresAdapter`, ver `src/payload.config.ts`) — usado por
 * `submit-form.ts`/cron do Ads (Fase 3) pra ler/escrever `cms.leads` direto,
 * sem passar pelo Payload. `server-only` garante que este módulo (e a
 * connection string) nunca vá pro bundle do client.
 *
 * Singleton em nível de módulo: Next.js reusa o módulo entre invocações de
 * uma mesma instância de servidor (dev com HMR é a exceção — ver
 * `globalThis` abaixo), então criar o `Pool` uma vez aqui e reexportar evita
 * abrir uma conexão nova por request, o que esgotaria rápido o pool pequeno
 * do Supabase (compartilhado com o Payload, que já reserva `max: 5`).
 */
const globalForPool = globalThis as unknown as { __cmsLeadsPool?: Pool }

function createPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URI,
    // Pool pequeno: mesma instância Supabase compartilhada com o Payload
    // (`max: 5` lá) — não competir por conexões do plano free/pequeno.
    max: 5,
    // Supabase (pooler e direct) exige TLS mas apresenta um cert fora da
    // trust store padrão do Node; sem isso o pg 8.x falha com
    // SELF_SIGNED_CERT_IN_CHAIN (mesma config de `src/payload.config.ts`).
    ssl: { rejectUnauthorized: false },
  })
}

/**
 * Em dev, o HMR do Next recarrega este módulo a cada edição — sem guardar o
 * `Pool` em `globalThis`, cada reload criaria um pool novo (e vazaria as
 * conexões dos anteriores, que nunca são fechadas). Em produção o módulo só
 * carrega uma vez por instância, então isso é só uma rede de segurança.
 */
export const pool: Pool = globalForPool.__cmsLeadsPool ?? createPool()

if (process.env.NODE_ENV !== 'production') {
  globalForPool.__cmsLeadsPool = pool
}

/**
 * Helper fino sobre `pool.query` — ponto único de acesso ao Postgres pra
 * quem for ler/escrever `cms.leads` (submit-form, cron do Ads). Sempre
 * qualificar as tabelas como `cms.<tabela>` nas queries (schema privado do
 * Payload, não exposto pelo PostgREST do Supabase — ver `db/leads.sql`).
 */
export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  return pool.query<T>(text, params)
}
