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
