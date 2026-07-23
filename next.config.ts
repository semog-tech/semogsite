import { withPayload } from '@payloadcms/next/withPayload'
import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qvxlkovrxfqigeaopvui.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
  async headers() {
    // Baseline security headers + CSP. The CSP is intentionally permissive on
    // 'unsafe-inline'/'unsafe-eval' and img/font/connect sources because the
    // Payload admin (/admin) and Next's own hydration bootstrap inject inline
    // scripts/styles that a strict `script-src 'self'` would block. Further
    // hardening (nonces, dropping unsafe-*) is deferred.
    //
    // `https://challenges.cloudflare.com` (Plan 4b Task 3) is Cloudflare
    // Turnstile's domain: `script-src` loads its `api.js`, `frame-src` is the
    // widget's own iframe, `connect-src` covers the XHR/fetch the widget does
    // from the top frame. Without all three the widget is silently blocked
    // by CSP (script won't load, or the iframe/its network calls get
    // refused) — verified empirically with no CSP violations after adding
    // these (see Task 3 report).
    //
    // `https://*.sentry.io` (Plan 4c Task 1) is where the browser SDK sends
    // error/performance events. DSN is deferred — without it the SDK is
    // disabled and never calls out — but the CSP allowance is added now so
    // nothing needs touching again once a DSN lands.
    //
    // `https://www.googletagmanager.com` + `https://*.google-analytics.com` +
    // `https://*.analytics.google.com` (GA4 / Consent Mode): `script-src` carrega
    // o `gtag.js`; `connect-src` cobre os hits do `/g/collect` (fetch/beacon);
    // `img-src` o pixel de fallback. SEM esses domínios o CSP bloqueia o gtag
    // INTEIRO → 0 page_view e 0 generate_lead no GA4 (bug corrigido 2026-07-23,
    // confirmado: 2.351 sessões / 0 pageviews em 28 dias por causa disso).
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "frame-src 'self' https://challenges.cloudflare.com https://td.doubleclick.net https://bid.g.doubleclick.net",
      "object-src 'none'",
      "img-src 'self' data: blob: https://qvxlkovrxfqigeaopvui.supabase.co https://www.googletagmanager.com https://*.google-analytics.com https://*.clarity.ms https://c.bing.com https://www.google.com https://www.google.com.br https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com",
      "media-src 'self' https://qvxlkovrxfqigeaopvui.supabase.co blob:",
      "font-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://www.googletagmanager.com https://*.clarity.ms https://www.googleadservices.com https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com",
      "connect-src 'self' https://qvxlkovrxfqigeaopvui.supabase.co https://challenges.cloudflare.com https://*.sentry.io https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://*.clarity.ms https://c.bing.com https://www.google.com https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com",
    ].join('; ')

    // Indexação DESLIGADA por padrão (ambiente de teste): emite
    // `X-Robots-Tag: noindex, nofollow` em TODAS as respostas, então o site não
    // aparece no Google. Só habilita indexação quando `SITE_ALLOW_INDEX==='true'`
    // (setar essa env só no launch real do domínio de produção).
    const allowIndex = process.env.SITE_ALLOW_INDEX === 'true'

    return [
      {
        source: '/(.*)',
        headers: [
          ...(allowIndex
            ? []
            : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]),
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },
  async redirects() {
    return [
      // Apex → www. O site é canônico em www.semog.com.br (canonical/OG/sitemap
      // em src/lib/seo.ts), então todo acesso ao domínio raiz faz 301 pro www.
      // A condição `host` restringe ao apex — não afeta o próprio www nem os
      // domínios *.vercel.app (preview/prod interno). Roda no edge da Vercel,
      // antes da app.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'semog.com.br' }],
        destination: 'https://www.semog.com.br/:path*',
        permanent: true,
      },
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/semog.html', destination: '/semog', permanent: true },
      { source: '/solucoes.html', destination: '/solucoes', permanent: true },
      {
        source: '/administracao-de-condominios.html',
        destination: '/administracao-de-condominios',
        permanent: true,
      },
      { source: '/garante.html', destination: '/garante', permanent: true },
      { source: '/incorporadoras.html', destination: '/incorporadoras', permanent: true },
      { source: '/blog.html', destination: '/blog', permanent: true },
      { source: '/contato.html', destination: '/contato', permanent: true },
      { source: '/proposta.html', destination: '/proposta', permanent: true },
      {
        source: '/administradora-de-condominios-recife.html',
        destination: '/administradora-de-condominios-recife',
        permanent: true,
      },
      {
        source: '/administradora-de-condominios-joao-pessoa.html',
        destination: '/administradora-de-condominios-joao-pessoa',
        permanent: true,
      },
      {
        source: '/administradora-de-condominios-campina-grande.html',
        destination: '/administradora-de-condominios-campina-grande',
        permanent: true,
      },
      {
        source: '/administradora-de-condominios-belem.html',
        destination: '/administradora-de-condominios-belem',
        permanent: true,
      },
      { source: '/privacidade.html', destination: '/privacidade', permanent: true },
      { source: '/termos.html', destination: '/termos', permanent: true },
      { source: '/guia.html', destination: '/', permanent: true },

      // ── Migração do WordPress antigo (www.semog.com.br) → 301 (permanent:true
      // = 308, tratado como permanente pelo Google) pras novas URLs. Origens sem
      // barra final (o Next normaliza a barra do WP). Lista tirada do sitemap do
      // WordPress (jul/2026). Home `/`, `/proposta` e `/blog` mantêm o caminho.

      // Landings de unidade: /locais/... → /administradora-de-condominios-*
      {
        source: '/locais/semog-administradora-de-condominios-recife',
        destination: '/administradora-de-condominios-recife',
        permanent: true,
      },
      {
        source: '/locais/semog-administradora-de-condominios-joao-pessoa',
        destination: '/administradora-de-condominios-joao-pessoa',
        permanent: true,
      },
      {
        source: '/locais/semog-administradora-de-condominios-campina-grande',
        destination: '/administradora-de-condominios-campina-grande',
        permanent: true,
      },
      {
        source: '/locais/semog-administradora-de-condominios-belem',
        destination: '/administradora-de-condominios-belem',
        permanent: true,
      },

      // Páginas institucionais
      { source: '/sobre', destination: '/semog', permanent: true },
      // `/domestica` (gestão de doméstica) não tem página equivalente — mando pra
      // Soluções. Ajustar se preferir outro destino.
      { source: '/domestica', destination: '/solucoes', permanent: true },

      // Posts antigos COM tema correspondente → post novo mais próximo
      {
        source: '/acabe-com-a-inadimplencia-de-seu-condominio',
        destination: '/blog/inadimplencia-condominio-o-que-a-lei-permite',
        permanent: true,
      },
      {
        source: '/assembleias-virtuais-apos-pandemia',
        destination: '/blog/assembleia-virtual-validade-juridica',
        permanent: true,
      },
      {
        source: '/prestacao-de-contas-do-condominio',
        destination: '/blog/previsao-orcamentaria-guia-sindico',
        permanent: true,
      },
      {
        source: '/despesas-ordinarias-e-extraordinarias-entenda-a-diferenca',
        destination: '/blog/fundo-reserva-quanto-guardar-por-mes',
        permanent: true,
      },
      {
        source: '/3-tipos-barulho-condominio-lei-silencio',
        destination: '/blog/areas-lazer-regras-de-uso',
        permanent: true,
      },
      {
        source: '/o-vizinho-insiste-no-som-alto-no-fim-de-semana-saiba-o-que-fazer',
        destination: '/blog/areas-lazer-regras-de-uso',
        permanent: true,
      },

      // Demais posts antigos (sem correspondência direta) → índice do blog
      { source: '/qual-o-prazo-para-guarda-de-documentos-em-condominio', destination: '/blog', permanent: true },
      { source: '/economia-de-energia-condominio-5-dicas', destination: '/blog', permanent: true },
      { source: '/inspecao-predial-5-coisas-sindico-deve-saber', destination: '/blog', permanent: true },
      { source: '/cigarros-eletronicos-condominio-permitido', destination: '/blog', permanent: true },
      { source: '/8-dicas-lidar-latidos-cachorro-condominio-copy', destination: '/blog', permanent: true },
      { source: '/precisamos-falar-sobre-a-acessibilidade-nos-condominios', destination: '/blog', permanent: true },
      {
        source: '/mudancas-na-legislacao-de-sst-entenda-os-impactos-nos-condominios',
        destination: '/blog',
        permanent: true,
      },
      { source: '/imovel-e-um-bom-investimento', destination: '/blog', permanent: true },
      { source: '/9-dicas-para-cuidar-da-saude-do-condominio', destination: '/blog', permanent: true },
      {
        source: '/saiba-como-aplicar-corretamente-advertencia-e-multa-de-condominio',
        destination: '/blog',
        permanent: true,
      },
      { source: '/checklist-para-comecar-2021-com-pe-direito', destination: '/blog', permanent: true },

      // Páginas de categoria do WordPress (qualquer uma) → índice do blog
      { source: '/category/:slug*', destination: '/blog', permanent: true },
    ]
  },
}

// Source-map upload (and every other build-time Sentry step that needs
// credentials) only runs when `SENTRY_AUTH_TOKEN` is set — without it the
// bundler plugin no-ops silently (`silent: true` suppresses its warning
// about the missing token instead of failing the build). This keeps
// `pnpm build` green with an empty Sentry env, which is the state until a
// DSN + auth token are provisioned.
export default withSentryConfig(withPayload(nextConfig, { devBundleServerPackages: false }), {
  silent: true,
  widenClientFileUpload: false,
  disableLogger: true,
})
