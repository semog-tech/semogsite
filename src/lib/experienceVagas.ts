import 'server-only'

import { cache } from 'react'
import { query } from '@/lib/db'
import { type EstadoDaInscricao, estadoDaInscricao } from '@/lib/experienceEstado'

/**
 * Leitura das vagas do Semog Experience — o lado do banco do estado da
 * inscrição. A regra que interpreta o número mora em `experienceEstado.ts`;
 * aqui só se conta e se trata a falha.
 *
 * **Uma linha de `cms.leads` é uma pessoa.** Acompanhante ocupa vaga como
 * qualquer inscrito (é assim que o kit praia é dimensionado), então a contagem
 * é de linhas, sem desduplicar por e-mail: duas inscrições do mesmo e-mail são
 * duas pessoas na areia e dois kits a separar.
 */

/** Quantas inscrições existem. `null` = não deu para contar (ver `lerEstadoDaInscricao`). */
async function contarInscricoes(): Promise<number | null> {
  // Sem `DATABASE_URI` não há o que contar, e isso NÃO é falha: é o build da CI
  // (`next build` roda sem banco e sem secrets, ver `.github/workflows/ci.yml`)
  // e o `next dev` de quem não configurou o .env. Distinguir dos dois casos
  // abaixo é o que mantém `console.error` como sinal de problema de verdade.
  if (!process.env.DATABASE_URI) {
    console.info('[experience] sem DATABASE_URI — página renderizada com a inscrição aberta.')
    return null
  }

  try {
    // `::int` porque o `pg` entrega `count(*)` (bigint) como STRING, para não
    // perder precisão além de 2^53. O total de inscritos cabe folgado num int4,
    // e sem o cast a comparação com `seats` seria string contra número.
    const { rows } = await query<{ total: number }>(
      `select count(*)::int as total from cms.leads where form = 'experience'`,
    )
    return rows[0]?.total ?? null
  } catch (err) {
    console.error('[experience] falha ao contar as inscrições:', err)
    return null
  }
}

/**
 * O estado da inscrição para este render.
 *
 * `cache` (React, não Next) memoiza por request: `generateMetadata` e a página
 * chamam isto no mesmo render e sem ele seriam duas idas ao Postgres para
 * responder a mesma pergunta. O cache de verdade é o ISR da rota — ver o
 * `export const revalidate` em `(evento)/experience/page.tsx`.
 *
 * **Nunca lança.** Falha de leitura vira `aberto` (ver `estadoDaInscricao`), e
 * o erro fica registrado no log, não engolido.
 */
export const lerEstadoDaInscricao = cache(async (): Promise<EstadoDaInscricao> => {
  return estadoDaInscricao(new Date(), await contarInscricoes())
})
