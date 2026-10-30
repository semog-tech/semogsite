import 'server-only'

import { attachDatabasePool } from '@vercel/functions'
import { Pool, type QueryResultRow } from 'pg'
import { conexaoComTls } from './db-tls'

/**
 * Pool `pg` sobre o `DATABASE_URI` (o Postgres do Supabase, atrás do HAProxy
 * da VPS) — o único caminho do site até o banco: `submit-form.ts`, os crons do
 * Ads e do Exact, o desfecho do lead, o rastreio de WhatsApp e de QR leem e
 * escrevem `cms.*` por aqui. `server-only` garante que este módulo (e a
 * connection string) nunca vá pro bundle do client.
 *
 * Singleton em nível de módulo: Next.js reusa o módulo entre invocações de
 * uma mesma instância de servidor (dev com HMR é a exceção — ver
 * `globalThis` abaixo), então criar o `Pool` uma vez aqui e reexportar evita
 * abrir uma conexão nova por request, o que esgotaria rápido as conexões do
 * Supabase.
 */
const globalForPool = globalThis as unknown as { __cmsLeadsPool?: Pool }

/**
 * Quanto um client devolvido ao pool fica aberto esperando reuso antes de o
 * `pg` fechá-lo. É o default do `pg-pool`, escrito aqui porque passou a ter um
 * segundo efeito: o `attachDatabasePool` lê este valor e mantém a função viva
 * por ele (+100ms) depois de cada `release` — ver `createPool`.
 */
const OCIOSO_MS = 10_000

function createPool(): Pool {
  const newPool = new Pool({
    // TLS verificado (cadeia e nome) contra as raízes da Supabase embutidas em
    // `db-tls.ts`, que também tira da URI qualquer `sslmode` — com ele o `pg`
    // descartaria o objeto `ssl` em silêncio.
    ...conexaoComTls(process.env.DATABASE_URI),
    // Pool pequeno: cada instância da função tem o seu, e o Supabase atrás do
    // HAProxy tem poucas conexões para dividir entre todas elas.
    max: 5,
    idleTimeoutMillis: OCIOSO_MS,
  })

  // A conexão passa pelo proxy HAProxy da VPS, que derruba conexões ociosas
  // do backend por timeout. Quando isso acontece com um client ocioso do
  // pool, o `pg` emite `'error'` no próprio `Pool` — e um `EventEmitter` sem
  // listener pra `'error'` lança exceção não capturada (derrubaria a
  // instância serverless / causaria 500 intermitente no caminho do form).
  // Registrar aqui, uma única vez por instância do `Pool` (dentro de
  // `createPool`, não a cada import do módulo), evita tanto o crash quanto
  // listeners duplicados no reload de HMR (`MaxListenersExceededWarning`).
  newPool.on('error', (err) => {
    console.error('[db] erro em client ocioso do pool', err)
  })

  // **Sem isto, a conexão fica presa por ~1h.** A Vercel suspende a função
  // assim que a resposta sai, e com ela o timer de `idleTimeoutMillis` do
  // `pg-pool`: o client ocioso nunca é fechado, o socket fica aberto do lado
  // do HAProxy até o timeout dele derrubar (sessão `cD` no log). A cada
  // `release`, `attachDatabasePool` pede à Vercel (`waitUntil`) que mantenha a
  // instância viva o tempo do ocioso, para o `pg` fechar o client ele mesmo.
  // Fora da Vercel (dev, testes, build — sem `VERCEL_URL`/`VERCEL_REGION`) ele
  // só registra o ouvinte de `release`, que não faz nada.
  attachDatabasePool(newPool)

  return newPool
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
 * quem for ler/escrever `cms.*` (submit-form, crons do Ads e do Exact).
 * Sempre qualificar as tabelas como `cms.<tabela>` nas queries (schema
 * privado, não exposto pelo PostgREST do Supabase — ver `db/leads.sql`).
 */
export function query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) {
  return pool.query<T>(text, params)
}
