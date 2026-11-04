import 'server-only'
import { z } from 'zod'
import { requisitarRd } from './client'
import type { ConfigRd } from './config'

const hash = /^[0-9a-f]{24}$/
const campo = z.object({
  id: z.string().regex(hash),
  slug: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  entity: z.literal('deal'),
})
const paginaSchema = z.object({
  data: z.array(campo),
  links: z.object({ next: z.string().nullable().optional() }).optional(),
})
let cache: { campos: z.infer<typeof campo>[]; venceEm: number } | undefined

/** O v2 usa slug tanto no payload quanto no @RDQL; IDs da UI exigem catálogo. */
export async function resolverCamposRd(token: string, config: ConfigRd): Promise<ConfigRd> {
  if (!Object.values(config.campos).some((valor) => valor && hash.test(valor))) return config
  const catalogo = await obterCatalogo(token)
  const campos = { ...config.campos }
  for (const chave of Object.keys(campos)) {
    // Chaves vêm do schema validado de ConfigRd, nunca da resposta HTTP.
    const alias = chave as keyof ConfigRd['campos']
    const referencia = campos[alias]
    if (!referencia || !hash.test(referencia)) continue
    const encontrados = catalogo.filter((item) => item.id === referencia)
    if (encontrados.length !== 1) {
      throw new Error(`RD Station: ID do campo ${alias} sem slug único no catálogo de negociações`)
    }
    campos[alias] = encontrados[0].slug
  }
  const slugs = Object.values(campos).filter((valor) => valor !== undefined)
  if (new Set(slugs).size !== slugs.length) {
    throw new Error('RD Station: IDs e slugs resolvem para o mesmo campo personalizado')
  }
  return { ...config, campos }
}

async function obterCatalogo(token: string): Promise<z.infer<typeof campo>[]> {
  if (cache && Date.now() < cache.venceEm) return cache.campos
  const campos: z.infer<typeof campo>[] = []
  for (let pagina = 1; pagina <= 20; pagina++) {
    const params = new URLSearchParams({
      filter: 'entity:deal',
      'page[size]': '100',
      'page[number]': String(pagina),
    })
    const res = paginaSchema.safeParse(await requisitarRd(token, `custom_fields?${params}`))
    if (!res.success) throw new Error('RD Station: catálogo de campos sem contrato ID/slug válido')
    campos.push(...res.data.data)
    if (!res.data.links?.next && res.data.data.length < 100) {
      cache = { campos, venceEm: Date.now() + 60_000 }
      return campos
    }
  }
  throw new Error('RD Station: catálogo de campos excedeu 2000 registros')
}
