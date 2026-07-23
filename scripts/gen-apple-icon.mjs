import { readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

/**
 * Rasteriza `src/app/icon.svg` em PNG 180x180 para o `apple-icon` (o Safari
 * ignora SVG em apple-touch-icon). Rodar de novo só quando a marca mudar —
 * o PNG é versionado, não é gerado no build.
 */
const svg = readFileSync('src/app/icon.svg')
const png = await sharp(svg, { density: 720 }).resize(180, 180).png().toBuffer()
writeFileSync('src/app/apple-icon.png', png)
console.log(`apple-icon.png gerado (${Math.round(png.length / 1024)} KB)`)
