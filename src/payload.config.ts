import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Company } from './globals/Company'
import { Footer } from './globals/Footer'
import { Header } from './globals/Header'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Pages, Posts, Categories],
  globals: [Header, Footer, Company, SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
      // pool pequeno: instância Supabase compartilhada com o webapp — não competir por conexões
      max: 5,
      // Supabase (pooler e direct) exige TLS mas apresenta um cert fora da trust store
      // padrão do Node; sem isso o pg 8.x falha com SELF_SIGNED_CERT_IN_CHAIN.
      ssl: { rejectUnauthorized: false },
    },
    // schema dedicado do CMS, isolado de public/auth/storage do webapp.
    // Precisa existir antes do init (criado via migration Supabase `create_cms_schema`).
    schemaName: 'cms',
    // em dev usamos push automático de schema; em prod, migrations (Task 6)
    push: process.env.NODE_ENV !== 'production',
  }),
  sharp,
  plugins: [
    seoPlugin({
      collections: ['pages', 'posts'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }) =>
        doc?.title
          ? `${doc.title} | Semog Administradora de Condomínios`
          : 'Semog Administradora de Condomínios',
      generateDescription: ({ doc }) => doc?.excerpt ?? doc?.meta?.description ?? '',
    }),
    s3Storage({
      collections: {
        media: {
          disablePayloadAccessControl: true, // servir direto do Supabase
          generateFileURL: ({ filename }) =>
            `${process.env.SUPABASE_STORAGE_PUBLIC_URL}/${process.env.S3_BUCKET}/${filename}`,
        },
      },
      bucket: process.env.S3_BUCKET ?? '',
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
        },
        region: process.env.S3_REGION,
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: true,
      },
    }),
  ],
})
