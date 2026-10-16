import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'
import { entradasDoSitemap } from '@/site/sitemap'

export const revalidate = 3600

/**
 * `/sitemap.xml`, gerado do inventário de URLs (src/site/sitemap.ts). Fica na raiz do App
 * Router, como `robots.ts`: o grupo `(frontend)`, onde morava, sai na limpeza da fase 7, e um
 * sitemap dentro dele sumiria junto.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return entradasDoSitemap(getAllPosts(), new Date())
}
