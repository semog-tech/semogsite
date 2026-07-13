import { withPayload } from '@payloadcms/next/withPayload'
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
    // scripts/styles that a strict `script-src 'self'` would block. Hardening
    // (nonces, dropping unsafe-*, adding Turnstile/Sentry/analytics domains)
    // is deferred to Plan 4b/4c once those integrations land.
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "img-src 'self' data: blob: https://qvxlkovrxfqigeaopvui.supabase.co",
      "font-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' https://qvxlkovrxfqigeaopvui.supabase.co",
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

export default withPayload(nextConfig, { devBundleServerPackages: false })
