import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import sharp from 'sharp'

/**
 * Extrai o primeiro frame de `public/hero/recife.mp4` para servir de `poster`
 * do hero — sem ele, a seção abre preta até o vídeo decodificar. Usa o
 * Chromium do Playwright (já é dependência do projeto, via `@playwright/test`
 * — o pacote `playwright` solto não está instalado aqui) em vez de ffmpeg,
 * que nem toda máquina tem instalado.
 *
 * Rodar de novo só quando o primeiro clipe da sequência mudar.
 */
const SRC = 'public/hero/recife.mp4'
const OUT = 'public/hero/poster.webp'

const tmp = mkdtempSync(join(tmpdir(), 'poster-'))
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })

const dataUrl = `data:video/mp4;base64,${readFileSync(SRC).toString('base64')}`
await page.setContent(
  `<style>body{margin:0}video{width:1280px;height:720px;object-fit:cover}</style><video id="v" muted src="${dataUrl}"></video>`,
)
await page.evaluate(
  () =>
    new Promise((resolve) => {
      const v = document.getElementById('v')
      v.onseeked = resolve
      v.currentTime = 0.1
    }),
)
const frame = join(tmp, 'frame.png')
writeFileSync(frame, await page.locator('#v').screenshot())
await browser.close()

const info = await sharp(frame).resize({ width: 1280 }).webp({ quality: 55 }).toFile(OUT)
console.log(`${OUT} gerado (${Math.round(info.size / 1024)} KB)`)
