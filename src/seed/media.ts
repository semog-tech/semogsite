import path from 'node:path'
import config from '@payload-config'
import { getPayload } from 'payload'
import { MEDIA_ASSETS } from './lib/media'

/**
 * Seed idempotente da coleção `media`: sobe todos os assets de
 * `_reference/assets/` (imagens + vídeos, ver `MEDIA_ASSETS` em
 * `src/seed/lib/media.ts`) via Payload Local API. O adapter
 * `@payloadcms/storage-s3` (config em `src/payload.config.ts`) empurra cada
 * arquivo pro bucket `media` do Supabase Storage automaticamente — não há
 * upload manual pro S3 aqui.
 *
 * Idempotente por `filename`: se já existe um doc `media` com aquele
 * filename, pula (não duplica, não reenvia).
 *
 * Executa via `pnpm seed:media` (`payload run src/seed/media.ts`): assim
 * como os demais seeds, obtém a própria instância do Payload — o CLI
 * `payload run` não injeta uma pronta.
 */

const repoRoot = process.cwd()

async function seedMedia() {
  const payload = await getPayload({ config })

  let created = 0
  let skipped = 0

  for (const asset of MEDIA_ASSETS) {
    const existing = await payload.find({
      collection: 'media',
      where: { filename: { equals: asset.filename } },
      limit: 1,
      pagination: false,
      depth: 0,
    })

    if (existing.docs[0]) {
      console.log(
        `[seed:media] "${asset.filename}" já existe (id=${existing.docs[0].id}) — pulando.`,
      )
      skipped++
      continue
    }

    const absolutePath = path.resolve(repoRoot, asset.path)

    const doc = await payload.create({
      collection: 'media',
      filePath: absolutePath,
      data: { alt: asset.alt },
    })
    console.log(`[seed:media] "${asset.filename}" criado (id=${doc.id}).`)
    created++
  }

  console.log(
    `[seed:media] Concluído: ${created} criados, ${skipped} pulados (total ${MEDIA_ASSETS.length}).`,
  )
}

await seedMedia()
