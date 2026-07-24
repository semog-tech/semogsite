import { expect, test } from '@playwright/test'

const MB = 1024 * 1024

test.describe('Vídeo de fundo do hero', () => {
  test('não baixa a sequência inteira no carregamento', async ({ page }) => {
    const videoBytes = new Map<string, number>()
    page.on('response', async (res) => {
      if (!/\/hero\/.*\.mp4/.test(res.url())) return
      const len = Number(res.headers()['content-length'] ?? 0)
      videoBytes.set(res.url(), (videoBytes.get(res.url()) ?? 0) + len)
    })

    await page.goto('http://localhost:3000/', { waitUntil: 'load' })
    await page.waitForTimeout(2500)

    const total = [...videoBytes.values()].reduce((a, b) => a + b, 0)
    // O primeiro clipe (recife.mp4) mede 799 KB. Como requisições HTTP range se sobrepõem,
    // o total de bytes não é uma medida confiável; o portão real é o número de clipes distintos.
    // Elevamos o teto a 1.1 MB para acomodar overlaps das range requests do primeiro clipe.
    expect(total, `baixou ${Math.round(total / 1024)} KB de vídeo`).toBeLessThan(1.1 * MB)
    expect(videoBytes.size, 'mais de um clipe pedido no load').toBeLessThanOrEqual(1)
  })

  test('mostra o poster antes do vídeo decodificar', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    const first = page.locator('section video').first()
    await expect(first).toHaveAttribute('poster', /poster\.webp/)
  })

  test('no mobile usa um clipe só', async ({ page }) => {
    const urls = new Set<string>()
    page.on('request', (req) => {
      if (/\/hero\/.*\.mp4/.test(req.url())) urls.add(req.url())
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('http://localhost:3000/', { waitUntil: 'load' })
    await page.waitForTimeout(3000)

    expect(urls.size).toBeLessThanOrEqual(1)
  })
})
