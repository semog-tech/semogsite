import { revalidatePath } from 'next/cache'

/**
 * Revalida (ISR on-demand) o caminho correspondente a um slug de página.
 * `home` mapeia para a raiz `/`; demais slugs viram `/${slug}`.
 *
 * `revalidatePath` exige um request store do Next.js (route handler/server
 * action) ativo. O mesmo hook roda fora desse contexto quando o Payload é
 * usado como script standalone (ex.: `payload run` em `src/seed/home.ts`),
 * onde revalidar não faz sentido e o Next lança
 * "Invariant: static generation store missing" — por isso o try/catch.
 */
export function revalidatePage(slug: string): void {
  try {
    revalidatePath(slug === 'home' ? '/' : `/${slug}`)
  } catch {
    // fora de um request Next.js (ex.: seed/script standalone): sem-op.
  }
}
