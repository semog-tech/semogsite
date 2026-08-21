import { describe, expect, it } from 'vitest'
import { img } from '@/../content/media'
import { EXPERIENCE_EVENT } from '@/data/experienceEvent'

/**
 * `img()` lança de propósito quando o filename não tem alt mapeado
 * (`content/media.ts`), para o alt nunca se perder. As mídias do Experience já
 * estão no bucket; este teste garante que o mapeamento existe e continua
 * amarrado aos filenames que `EXPERIENCE_EVENT` declara — renomear o vídeo lá
 * sem mapear o alt aqui quebra a página em runtime, não no build.
 */
const BUCKET = 'https://qvxlkovrxfqigeaopvui.supabase.co/storage/v1/object/public/media/'

const ARQUIVOS = [
  'experience-hero.webp',
  'experience-local.webp',
  'experience-2025-poster.webp',
  'experience-2025.mp4',
]

describe('alts das mídias do Semog Experience', () => {
  it.each(ARQUIVOS)('%s resolve com URL do bucket e alt descritivo', (file) => {
    const media = img(file)
    expect(media.url).toBe(BUCKET + file)
    expect(media.alt.length).toBeGreaterThan(10)
    expect(media.alt).not.toContain(file)
  })

  it('o vídeo e a capa declarados em EXPERIENCE_EVENT estão mapeados', () => {
    expect(() => img(EXPERIENCE_EVENT.video.file)).not.toThrow()
    expect(() => img(EXPERIENCE_EVENT.video.poster)).not.toThrow()
  })
})
