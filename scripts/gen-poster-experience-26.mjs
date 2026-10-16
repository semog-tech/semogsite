import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import sharp from 'sharp'

/**
 * Capa do reel do Semog Experience 26 (Comunidade da home do site v2 e landing /experience). Mesmo
 * método do `gen-hero-poster.mjs`: o Chromium do Playwright tira o quadro e o sharp grava em webp,
 * sem depender de ffmpeg. O quadro é o de `INSTANTE` segundos; conferir a imagem gerada e ajustar
 * se cair num quadro escuro ou borrado. Rodar de novo só se o vídeo mudar.
 */
const SRC = 'public/site-v2/videos/semog-experience-26.mp4'
const OUT = 'public/site-v2/videos/semog-experience-26-poster.webp'
const INSTANTE = 1
const LARGURA = 720
const ALTURA = 1280

const tmp = mkdtempSync(join(tmpdir(), 'poster-'))
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: LARGURA, height: ALTURA } })
  const dataUrl = `data:video/mp4;base64,${readFileSync(SRC).toString('base64')}`
  await page.setContent(
    `<style>body{margin:0}video{width:${LARGURA}px;height:${ALTURA}px;object-fit:cover}</style><video id="v" muted src="${dataUrl}"></video>`,
  )
  await page.evaluate(
    (instante) =>
      new Promise((resolve, reject) => {
        const v = document.getElementById('v')
        v.onerror = () => reject(new Error('o Chromium não decodificou o vídeo'))
        v.onseeked = resolve
        v.currentTime = instante
      }),
    INSTANTE,
  )
  const frame = join(tmp, 'frame.png')
  writeFileSync(frame, await page.locator('#v').screenshot())
  const info = await sharp(frame).webp({ quality: 60 }).toFile(OUT)
  console.log(`${OUT} gerado (${Math.round(info.size / 1024)} KB)`)
} finally {
  await browser.close()
  rmSync(tmp, { recursive: true, force: true })
}
