import { revalidatePath } from 'next/cache'

/**
 * Revalida (ISR on-demand) o caminho correspondente a um slug de página.
 * `home` mapeia para a raiz `/`; demais slugs viram `/${slug}`.
 */
export function revalidatePage(slug: string): void {
  revalidatePath(slug === 'home' ? '/' : `/${slug}`)
}
