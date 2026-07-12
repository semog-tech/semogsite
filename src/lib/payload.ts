import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'
import type { Page } from '@/payload-types'

/**
 * `cache()` (React, dedupe por requisição) garante que `HeaderServer` e
 * `FooterServer` — que chamam isso de forma independente no mesmo request —
 * compartilhem uma única chamada a `getPayload`. Sem isso, duas chamadas
 * concorrentes disputam a mesma promise interna de conexão do Payload; se o
 * Postgres estiver inacessível, isso produz unhandledRejections espúrias no
 * console mesmo com o try/catch em cada chamador.
 */
export const getPayloadClient = cache(async () => {
  return getPayload({ config })
})

export async function getPageBySlug(slug: string): Promise<Page | null> {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  return res.docs[0] ?? null
}
