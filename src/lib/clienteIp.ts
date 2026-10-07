import 'server-only'
import { headers } from 'next/headers'

/**
 * IP do cliente a partir de `x-forwarded-for` (Vercel/proxies padrão
 * preenchem esse header; primeiro valor da lista é o cliente original).
 * `undefined` se ausente (ex.: `next dev` sem proxy na frente) — quem chama
 * cai pro fallback `'anon'` do rate limit.
 *
 * Vive fora de `submit-form.ts` porque módulo `'use server'` só pode exportar
 * Server Action, e esta função também serve às actions da 2ª via.
 */
export async function clienteIp(): Promise<string | undefined> {
  const headerList = await headers()
  const forwardedFor = headerList.get('x-forwarded-for')
  if (!forwardedFor) return undefined
  return forwardedFor.split(',')[0]?.trim() || undefined
}
