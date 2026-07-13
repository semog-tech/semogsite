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
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "frame-src 'self' https://challenges.cloudflare.com",
      "object-src 'none'",
      "img-src 'self' data: blob: https://qvxlkovrxfqigeaopvui.supabase.co",
      "font-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
      "connect-src 'self' https://qvxlkovrxfqigeaopvui.supabase.co https://challenges.cloudflare.com https://*.sentry.io",
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
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
