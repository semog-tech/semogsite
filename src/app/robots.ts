import type { MetadataRoute } from 'next'
import { absoluteUrl, siteUrl } from '@/lib/seo'

/**
 * `/robots.txt` — aponta pro sitemap dinâmico e bloqueia admin/API do Payload.
 *
 * Fica em `src/app/robots.ts` (raiz do App Router), não em
 * `src/app/(frontend)/robots.ts` — no Next 16.2.6 + Turbopack (dev), um
 * `robots.ts` dentro do route group `(frontend)` nunca é registrado como rota
 * (cai direto no catch-all `[[...slug]]` e devolve 404); `sitemap.ts` no
 * mesmo route group funciona normalmente. Confirmado isolando o catch-all e
 * testando `robots.ts` na raiz — resolve 200 imediatamente. Route groups não
 * afetam a URL, então `/robots.txt` continua sendo servido do jeito certo.
 */
export default function robots(): MetadataRoute.Robots {
  // Indexação DESLIGADA por padrão (ambiente de teste): bloqueia TODOS os
  // crawlers e não expõe o sitemap. Só libera quando SITE_ALLOW_INDEX==='true'
  // (launch real). Combina com o `X-Robots-Tag: noindex` do next.config.
  const allowIndex = process.env.SITE_ALLOW_INDEX === 'true'

  if (!allowIndex) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api'],
    },
    sitemap: absoluteUrl('sitemap.xml'),
    host: siteUrl(),
  }
}
