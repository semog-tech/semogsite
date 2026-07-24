import { describe, expect, it } from 'vitest'
import type { Media } from '@/types/media'

describe('tipo Media', () => {
  it('aceita o shape mínimo que os componentes leem', () => {
    const m: Media = { url: 'https://x/y.webp', alt: 'foto', width: 800, height: 600 }
    expect(m.url).toBe('https://x/y.webp')
  })

  it('aceita url/alt nulos (campos opcionais do CMS)', () => {
    const m: Media = { url: null, alt: null }
    expect(m.url).toBeNull()
  })
})
